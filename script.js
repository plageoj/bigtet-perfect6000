/**
 * @fileoverview
 * Script for a bowling-like game score calculator that allows multiple players to input their scores.
 * It dynamically updates the score table based on user input and settings.
 * The game supports a configurable number of frames and a strike score.
 */
(() => {
  "use strict";

  const players = 2;

  /** @type {HTMLTableElement} */
  const displayTable = document.getElementById("display");
  /** @type {HTMLTableElement} */
  const inputTable = document.getElementById("input");
  /** @type {HTMLFormElement} */
  const settingsForm = document.getElementById("settings");

  /** @type {{name: string, throws: number[]}[]} */
  const scores = [];

  /** Retrieve number of frames in a game */
  const getFrames = () => Number(settingsForm.elements["frames"].value);
  /** Retrieve required score for a strike */
  const getStrike = () => Number(settingsForm.elements["strike"].value);

  /** Reset scores for all players */
  const resetScores = () => {
    for (let player = 1; player <= players; player++) {
      scores[player] = { name: `Player ${player}`, throws: [] };
      for (let throws = 1; throws <= getFrames() * 2 + 1; throws++) {
        scores[player].throws[throws] = NaN;
      }
    }
  };

  /** Construct score table */
  const drawScoreTable = () => {
    const frames = getFrames();
    const strike = getStrike();

    displayTable.innerHTML = "";

    /** Validate throws array
     * @param {number[]} input - Array of throws for a player
     */
    const validate = (input) => {
      for (let throws = 1; throws <= frames * 2 + 1; throws++) {
        if (input[throws] < 0) input[throws] = 0;
        if (input[throws] > strike) input[throws] = strike;
      }
      for (let frame = 1; frame <= frames; frame++) {
        if (frame === frames) {
          if (input[frame * 2 - 1] + input[frame * 2] < strike)
            input[frame * 2 + 1] = NaN;
          else break;
        }
        if (input[frame * 2 - 1] + input[frame * 2] > strike)
          input[frame * 2] = strike - input[frame * 2 - 1];
        if (input[frame * 2 - 1] >= strike) input[frame * 2] = NaN;
      }
    };

    /** Convert a throw to a string representation
     * @param {number[]} input - Array of throws for a player
     * @param {number} throws - Index of the throw to convert
     * @returns {string} - String representation of the throw
     */
    const throwString = (input, throws) => {
      const currentThrow = input[throws];
      if (isNaN(currentThrow)) return "&nbsp;";
      if (
        throws % 2 === 1 ||
        (throws === frames * 2 && input[throws - 1] >= strike)
      ) {
        if (currentThrow >= strike) return "X";
        if (currentThrow === 0) return "G";
        return currentThrow.toString();
      }
      if (currentThrow + input[throws - 1] >= strike) return "/";
      if (currentThrow === 0) return "-";
      return currentThrow.toString();
    };

    /** Calculate subtotal score for each frame
     * @param {number[]} input - Array of throws for a player
     */
    const frameTotal = (input) => {
      /** @type {number[]} */
      const result = [];

      const next = (throws) => {
        if (isNaN(input[throws + 1])) return next(throws + 1);
        if (throws > frames * 2 + 1) throw new Error("Invalid frame access");
        return throws + 1;
      };

      const capStrike = (value) => (value > strike ? strike : value);

      for (let throws = 1; throws <= frames * 2; throws += 2) {
        try {
          if (input[throws] >= strike) {
            const first = capStrike(input[next(throws)]);
            const second = capStrike(input[next(next(throws))]);
            result.push(strike + first + second);
            continue;
          }
          if (input[throws + 1] + input[throws] >= strike) {
            result.push(strike + capStrike(input[next(next(throws))]));
            continue;
          }
          if (isNaN(input[throws + 1]) || isNaN(input[throws])) {
            result.push(NaN);
            continue;
          }
          result.push(input[throws] + input[throws + 1]);
        } catch {
          result.push(NaN);
        }
      }
      return result;
    };

    const displayHeader = displayTable.insertRow();
    displayHeader.insertAdjacentHTML("afterbegin", "<th>Player</th>");
    for (let frame = 1; frame <= frames; frame++) {
      displayHeader.insertAdjacentHTML(
        "beforeend",
        `<th colspan="${frame === frames ? 3 : 2}">${frame}</th>`
      );
    }
    displayHeader.insertAdjacentHTML("beforeend", "<th>Total</th>");

    for (let player = 1; player <= players; player++) {
      const throwRow = displayTable.insertRow();
      const frameRow = displayTable.insertRow();

      validate(scores[player].throws);

      throwRow.insertAdjacentHTML(
        "afterbegin",
        `<th rowspan="2" class="player-name">${scores[player].name}</th>`
      );
      for (let throws = 1; throws <= frames * 2 + 1; throws++) {
        throwRow.insertAdjacentHTML(
          "beforeend",
          `<td>${throwString(scores[player].throws, throws)}</td>`
        );
      }
      const subtotal = frameTotal(scores[player].throws);
      for (let frame = 1, sum = 0; frame <= frames; frame++) {
        frameRow.insertAdjacentHTML(
          "beforeend",
          `<td colspan="${frame === frames ? 3 : 2}">${
            isNaN(subtotal[frame - 1]) ? "&nbsp;" : (sum += subtotal[frame - 1])
          }</td>`
        );
      }
      const total = subtotal.reduce((sum, value) => sum + value, 0);
      throwRow.insertAdjacentHTML(
        "beforeend",
        `<td rowspan="2" class="total">${isNaN(total) ? "&nbsp;" : total}</td>`
      );
    }
  };

  /** Construct input table for player scores
   */
  const drawInputTable = () => {
    inputTable.innerHTML = "";
    const frames = getFrames();
    const strike = getStrike();

    const inputHeader = inputTable.insertRow();
    inputHeader.insertAdjacentHTML("afterbegin", "<th>Player</th>");
    for (let frame = 1; frame <= frames; frame++) {
      inputHeader.insertAdjacentHTML(
        "beforeend",
        `<th colspan="${frame === frames ? 3 : 2}">${frame}</th>`
      );
    }

    for (let player = 1; player <= players; player++) {
      const inputRow = inputTable.insertRow();
      inputRow.insertAdjacentHTML(
        "afterbegin",
        `<th>
            <input type="text" tabindex="${player}" data-player="${player}"
                class="input-player-name" placeholder="プレイヤー名" />
        </th>`
      );
      for (let throws = 1; throws <= frames * 2 + 1; throws++) {
        inputRow.insertAdjacentHTML(
          "beforeend",
          `<td>
                <input type="number" tabindex="${throws * players + player + 2}"
                    data-player="${player}" data-throw="${throws}"
                    class="input-throw" min="0" max="${strike}" value="" />
          </td>`
        );
      }
    }

    Array.from(document.getElementsByClassName("input-player-name")).forEach(
      (input) => {
        input.addEventListener("blur", (event) => {
          const player = event.target.dataset.player;
          scores[player].name = event.target.value;
          drawScoreTable();
        });
      }
    );

    Array.from(document.getElementsByClassName("input-throw")).forEach(
      (input) => {
        input.addEventListener("blur", (event) => {
          const player = event.target.dataset.player;
          const throwIndex = event.target.dataset.throw;
          scores[player].throws[throwIndex] = parseInt(event.target.value, 10);
          drawScoreTable();
        });
      }
    );
  };

  resetScores();
  drawScoreTable();
  drawInputTable();

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    resetScores();
    drawScoreTable();
    drawInputTable();
  });
})();
