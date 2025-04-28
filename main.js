import "./style.css";
import { words as WORDS_EN } from "./dataEN.js";
import { palabras as WORDS_ES } from "./dataES.js";

const $time = document.querySelector("time");
const $paragraph = document.querySelector("p");
const $input = document.querySelector("input");

const $game = document.querySelector("#game");
const $results = document.querySelector("#results");
const $wpm = $results.querySelector("#results-wpm");
const $accuracy = $results.querySelector("#results-accuracy");
const $button = document.querySelector("#restart-btn");
const $progressBar = document.getElementById("progressbar");

const $time30 = document.getElementById("time-30");
const $time60 = document.getElementById("time-60");
const $time90 = document.getElementById("time-90");

const $timeSwitch = document.getElementById("timeSwitcher");
let activeTime = $timeSwitch.querySelector(".active");

var initialTime = activeTime.value;

let words = [];

var currentTime = initialTime;

let initialWords = WORDS_EN;
let intervalId;
initEvents();

var selectedLenguage = document.getElementById("select-language");

function onChange() {
    gameOver();
    let text = selectedLenguage.options[selectedLenguage.selectedIndex].text;
    if (text.toLowerCase() == "english") {
        initialWords = WORDS_EN;
    } else if (text.toLowerCase() == "spanish") {
        initialWords = WORDS_ES;
    }

    initGame();
}
selectedLenguage.onchange = onChange;
onChange();

function initGame() {
    $results.style.display = "none";
    $input.removeAttribute("disabled");

    if(intervalId) clearInterval(intervalId);

    words = initialWords.toSorted(() => Math.random() - 0.5).slice(0, 50);
    currentTime = initialTime;

    $time.textContent = currentTime;

    $paragraph.innerHTML = words
        .map((word, index) => {
            const letters = word.split("");

            return `
    <x-word>
        ${letters.map((letter) => `<x-letter>${letter}</x-letter>`).join("")}
    </x-word>
    `;
        })
        .join("");

    const $firstWord = $paragraph.querySelector("x-word");
    $firstWord.classList.add("active");
    $firstWord.querySelector("x-letter").classList.add("active");

    if(intervalId) clearInterval(intervalId);

    $progressBar.style.width = `100%`;
    
    intervalId = setInterval(() => {
        currentTime--;
        $time.textContent = currentTime;
        let percentage = ((currentTime / initialTime) * 100).toFixed(2);

        $progressBar.style.width = `${percentage}%`;

        if (currentTime === 0) {
            clearInterval(intervalId);
            $progressBar.style.width = "0%";
            gameOver();
        }
    }, 1000);
}

function onKeyUp() {
    // recuperamos los elementos actuals
    const $currentWord = $paragraph.querySelector("x-word.active");
    const $currentLetter = $currentWord.querySelector("x-letter.active");

    const currentWord = $currentWord.innerText.trim();
    $input.maxLength = currentWord.length;

    const $allLetters = $currentWord.querySelectorAll("x-letter");

    $allLetters.forEach(($letter) =>
        $letter.classList.remove("correct", "incorrect")
    );

    $input.value.split("").forEach((char, index) => {
        const $letter = $allLetters[index];
        const letterToCheck = currentWord[index];
        
        const isCorrect = char.toLowerCase() === letterToCheck.toLowerCase();
        const letterClass = isCorrect ? "correct" : "incorrect";
        $letter.classList.add(letterClass);
    });

    $currentLetter.classList.remove("active", "is-last");
    const inputLength = $input.value.length;
    const $nextActiveLetter = $allLetters[inputLength];

    if ($nextActiveLetter) {
        $nextActiveLetter.classList.add("active");
    } else {
        $currentLetter.classList.add("active", "is-last");
    }

    if ($currentWord.nextElementSibling === null && $currentLetter.classList.contains("is-last"))
        gameOver();
    
}

function playFortuneSound() {
    const audio = new Audio("./sounds/fortune.mp3");
    audio.volume = 0.1;
    audio.play().catch(error => console.error('Error al reproducir:', error));
}

function onKeyDown(event) {
    const $currentWord = $paragraph.querySelector("x-word.active");
    const $currentLetter = $currentWord.querySelector("x-letter.active");

    const { key } = event;
    if (key === " ") {
        event.preventDefault();

        const $nextWord = $currentWord.nextElementSibling;
        const $nextLetter = $nextWord.querySelector("x-letter");

        $currentWord.classList.remove("active", "marked");
        $currentLetter.classList.remove("active");

        $nextWord.classList.add("active");
        $nextLetter.classList.add("active");

        $input.value = "";

        const hasMissedLetters =
            $currentWord.querySelectorAll("x-letter:not(.correct)").length > 0;

        const classToAdd = hasMissedLetters ? "marked" : "correct";
        $currentWord.classList.add(classToAdd);

        if (!$currentWord.classList.contains("marked")) playFortuneSound();
        

        return;
    }

    if (key === "Backspace") {
        const $prevWord = $currentWord.previousElementSibling;
        const $prevLetter = $currentLetter.previousElementSibling;

        if (!$prevWord && !$prevLetter) {
            event.preventDefault();
            return;
        }

        const $wordMarked = $paragraph.querySelector("x-word.marked");
        if ($wordMarked && !$prevLetter) {
            event.preventDefault();
            $prevWord.classList.remove("marked");
            $prevWord.classList.add("active");

            const $letterToGo = $prevWord.querySelector("x-letter:last-child");

            $currentLetter.classList.remove("active");
            $letterToGo.classList.add("active");

            $input.value = [
                ...$prevWord.querySelectorAll(
                    "x-letter.correct, x-letter.incorrect"
                ),
            ]
                .map(($el) => {
                    return $el.classList.contains("correct")
                        ? $el.innerText
                        : "*";
                })
                .join("");
        }
    }
}

function initEvents() {
    document.addEventListener("keydown", () => {
        $input.focus();
    });
    $input.addEventListener("keydown", onKeyDown);
    $input.addEventListener("keyup", onKeyUp);
    $button.addEventListener("click", initGame);

    $timeSwitch.querySelectorAll("button").forEach(($button) => {
        $button.addEventListener("click", () => {
            activeTime.classList.remove("active");
            activeTime = $button;
            activeTime.classList.add("active");
            initialTime = activeTime.value;
            initGame();
        });
    });
}

function gameOver() {
    $results.style.display = "flex";

    $input.setAttribute("disabled", true);
    clearInterval(intervalId);
    $time.textContent = currentTime;

    const correctWords = $paragraph.querySelectorAll("x-word.correct").length;
    const correctLetter =
        $paragraph.querySelectorAll("x-letter.correct").length;
    const incorrectLetter =
        $paragraph.querySelectorAll("x-letter.incorrect").length;

    const totalLetters = correctLetter + incorrectLetter;

    const accuracy =
        totalLetters > 0 ? (correctLetter / totalLetters) * 100 : 0;

    const wpm = (correctWords * initialTime) / (initialTime - currentTime);
    $wpm.textContent = wpm.toFixed(2);
    $accuracy.textContent = `${accuracy.toFixed(2)}%`;
}
