// Убедитесь, что файл sudoku.js (или sudoku.min.js) подключен в index.html ПЕРЕД этим скриптом.
// <script src="sudoku.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // --- Получение ссылок на элементы DOM ---
    const boardElement = document.getElementById('sudoku-board');
    const checkButton = document.getElementById('check-button');
    const newGameButton = document.getElementById('new-game-button');
    const statusMessageElement = document.getElementById('status-message');
    const numpad = document.getElementById('numpad');
    const noteToggleButton = document.getElementById('note-toggle-button'); // Кнопка режима заметок

    // --- Переменные состояния игры ---
    let currentPuzzle = null; // Головоломка в виде строки
    let currentSolution = null; // Решение головоломки в виде строки
    let userGrid = []; // Массив 9x9 объектов { value: number, notes: Set<number> }
    let selectedCell = null; // Ссылка на выбранный DOM-элемент ячейки (<div>)
    let selectedRow = -1;    // Индекс строки выбранной ячейки
    let selectedCol = -1;    // Индекс колонки выбранной ячейки
    let isNoteMode = false; // Флаг: включен ли режим ввода заметок

    // --- Инициализация новой игры ---
    function initGame() {
        console.log("Запуск initGame...");
        try {
            // Проверка наличия библиотеки
            if (typeof sudoku === 'undefined' || !sudoku || typeof sudoku.generate !== 'function') {
                throw new Error("Библиотека sudoku.js не загружена или неисправна.");
            }
            console.log("Библиотека sudoku найдена.");

            // Генерация и решение
            currentPuzzle = sudoku.generate("medium"); // Можно выбрать сложность
            if (!currentPuzzle) throw new Error("Генерация не удалась");
            currentSolution = sudoku.solve(currentPuzzle);
            if (!currentSolution) throw new Error("Не удалось найти решение");

            // Инициализация userGrid объектами
            userGrid = boardStringToObjectArray(currentPuzzle);

            renderBoard(); // Полная отрисовка доски
            clearSelection(); // Сброс выделения
            statusMessageElement.textContent = ''; // Очистка статуса
            statusMessageElement.className = '';
            isNoteMode = false; // Выключаем режим заметок по умолчанию
            updateNoteToggleButtonState(); // Обновляем вид кнопки заметок
            console.log("Новая игра успешно инициализирована.");

        } catch (error) {
            console.error("ОШИБКА в initGame:", error);
            statusMessageElement.textContent = "Ошибка генерации судоку! " + error.message;
            statusMessageElement.className = 'incorrect-msg';
            boardElement.innerHTML = '<p style="color: red; text-align: center;">Не удалось загрузить игру.</p>';
        }
    }

    // --- Преобразование строки головоломки в массив объектов ---
    function boardStringToObjectArray(boardString) {
        const grid = [];
        for (let r = 0; r < 9; r++) {
            grid[r] = [];
            for (let c = 0; c < 9; c++) {
                const char = boardString[r * 9 + c];
                const value = (char === '.' || char === '0') ? 0 : parseInt(char);
                // Каждая ячейка - объект со значением и набором заметок
                grid[r][c] = {
                    value: value,
                    notes: new Set() // Изначально заметки пустые
                };
            }
        }
        return grid;
    }

    // --- Отрисовка ВСЕЙ доски ---
    function renderBoard() {
        boardElement.innerHTML = ''; // Очищаем старую доску
        if (!userGrid || userGrid.length !== 9) {
             console.error("renderBoard: Некорректные данные userGrid.");
             return;
        }
        // Создаем и добавляем каждую ячейку
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cellElement = createCellElement(r, c);
                boardElement.appendChild(cellElement);
            }
        }
        console.log("Доска перерисована.");
    }

    // --- Создание DOM-элемента для ОДНОЙ ячейки ---
    function createCellElement(r, c) {
        // Создаем основной div ячейки
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;

        const cellData = userGrid[r][c]; // Данные {value, notes} для этой ячейки

        // Создаем контейнер для основного значения
        const valueContainer = document.createElement('div');
        valueContainer.classList.add('cell-value-container');

        // Создаем контейнер для сетки заметок
        const notesContainer = document.createElement('div');
        notesContainer.classList.add('cell-notes-container');

        // Определяем, что показывать: значение или заметки
        if (cellData.value !== 0) {
            // Показываем основное значение
            valueContainer.textContent = cellData.value;
            valueContainer.style.display = 'flex'; // Показать контейнер значения
            notesContainer.style.display = 'none';  // Скрыть контейнер заметок
            // Отмечаем, если это изначальная цифра
            const puzzleChar = currentPuzzle[r * 9 + c];
            if (puzzleChar !== '.' && puzzleChar !== '0') {
                cell.classList.add('given');
            }
        } else if (cellData.notes.size > 0) {
            // Показываем заметки, если они есть (и нет основного значения)
            valueContainer.style.display = 'none';  // Скрыть контейнер значения
            notesContainer.style.display = 'grid'; // Показать контейнер заметок
            // Заполняем сетку 3x3 для заметок
            notesContainer.innerHTML = ''; // Очищаем предыдущие заметки
            for (let n = 1; n <= 9; n++) {
                const noteDigit = document.createElement('div');
                noteDigit.classList.add('note-digit');
                noteDigit.textContent = cellData.notes.has(n) ? n : ''; // Показать цифру, если она есть в Set
                notesContainer.appendChild(noteDigit);
            }
        } else {
            // Ячейка пуста (ни значения, ни заметок)
            valueContainer.textContent = '';
            valueContainer.style.display = 'flex'; // Показать пустой контейнер значения
            notesContainer.style.display = 'none';  // Скрыть контейнер заметок
        }

        // Добавляем оба контейнера (один из них будет скрыт через CSS)
        cell.appendChild(valueContainer);
        cell.appendChild(notesContainer);

        // Добавляем классы для толстых границ блоков
        cell.classList.remove('thick-border-bottom', 'thick-border-right');
        if ((c + 1) % 3 === 0 && c < 8) cell.classList.add('thick-border-right');
        if ((r + 1) % 3 === 0 && r < 8) cell.classList.add('thick-border-bottom');

        return cell; // Возвращаем созданный элемент
    }

    // --- Перерисовка только ОДНОЙ измененной ячейки ---
    function renderCell(r, c) {
        // Находим старый DOM-элемент ячейки
        const oldCell = boardElement.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
        if (oldCell) {
            // Создаем новый DOM-элемент с актуальными данными
            const newCell = createCellElement(r, c);
            // Копируем классы состояний (selected, incorrect), если они были
            if (oldCell.classList.contains('selected')) newCell.classList.add('selected');
            if (oldCell.classList.contains('incorrect')) newCell.classList.add('incorrect');
            // Если эта ячейка была выбрана, обновляем ссылку selectedCell
            if (selectedRow === r && selectedCol === c) {
                selectedCell = newCell;
            }
            // Заменяем старый элемент новым в DOM
            oldCell.replaceWith(newCell);
        } else {
            console.warn(`renderCell: Не найдена ячейка [${r}, ${c}] для перерисовки.`);
        }
    }

    // --- Вспомогательные функции ---

    // Получение правильного значения из строки-решения
    function getSolutionValue(row, col) {
        if (!currentSolution) return null;
        const char = currentSolution[row * 9 + col];
        return (char === '.' || char === '0') ? 0 : parseInt(char);
    }

    // Снятие выделения с ячейки
    function clearSelection() {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        selectedCell = null;
        selectedRow = -1;
        selectedCol = -1;
    }

    // Очистка подсветки ошибок
    function clearErrors() {
        boardElement.querySelectorAll('.cell.incorrect').forEach(cell => {
            cell.classList.remove('incorrect');
        });
        statusMessageElement.textContent = '';
        statusMessageElement.className = '';
    }

    // Обновление вида кнопки режима заметок
    function updateNoteToggleButtonState() {
        if (isNoteMode) {
            noteToggleButton.classList.add('active'); // Добавляем класс для CSS
            noteToggleButton.title = "Режим заметок (ВКЛ)"; // Всплывающая подсказка
        } else {
            noteToggleButton.classList.remove('active'); // Убираем класс
            noteToggleButton.title = "Режим заметок (ВЫКЛ)";
        }
    }

    // --- Обработчики событий ---

    // Клик по доске (выбор ячейки)
    boardElement.addEventListener('click', (event) => {
        const target = event.target.closest('.cell'); // Ищем ячейку, даже если кликнули на дочерний элемент
        if (!target) { // Клик мимо ячеек
             clearSelection();
             return;
        }

        // Проверяем, что ячейка не изначальная
        if (!target.classList.contains('given')) {
            clearSelection(); // Снять старое выделение
            selectedCell = target; // Запомнить новую
            selectedRow = parseInt(target.dataset.row);
            selectedCol = parseInt(target.dataset.col);
            selectedCell.classList.add('selected'); // Выделить
            clearErrors();
        } else {
            // Кликнули на изначальную цифру
            clearSelection(); // Просто снять выделение
        }
    });

    // Клик по цифровой панели (ввод/стирание/переключение режима)
    numpad.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return; // Клик мимо кнопки

        // --- Обработка кнопки переключения режима ---
        if (button.id === 'note-toggle-button') {
            isNoteMode = !isNoteMode; // Переключаем режим
            updateNoteToggleButtonState(); // Обновляем вид кнопки
            console.log("Режим заметок:", isNoteMode ? "ВКЛ" : "ВЫКЛ");
            return; // Больше ничего не делаем
        }

        // --- Обработка остальных кнопок (только если ячейка выбрана) ---
        if (!selectedCell) {
            console.log("Клик по кнопке, но ячейка не выбрана.");
            return;
        }

        clearErrors(); // Убираем ошибки при любом действии с ячейкой
        const cellData = userGrid[selectedRow][selectedCol]; // Получаем данные {value, notes}

        if (button.id === 'erase-button') {
            // --- Стирание ---
            if (cellData.value !== 0 || cellData.notes.size > 0) { // Стираем только если есть что стирать
                cellData.value = 0;
                cellData.notes.clear();
                renderCell(selectedRow, selectedCol); // Перерисовать ячейку
                console.log(`Очищена ячейка [${selectedRow}, ${selectedCol}]`);
            }
        } else if (button.dataset.num) {
            // --- Ввод цифры ---
            const num = parseInt(button.dataset.num);
            if (isNoteMode) {
                // --- Режим заметок: добавляем/удаляем заметку (toggle) ---
                // Нельзя добавлять заметки, если уже есть основное значение
                if (cellData.value === 0) {
                     if (cellData.notes.has(num)) {
                        cellData.notes.delete(num);
                        console.log(`Удалена заметка ${num} в [${selectedRow}, ${selectedCol}]`);
                    } else {
                        cellData.notes.add(num);
                        console.log(`Добавлена заметка ${num} в [${selectedRow}, ${selectedCol}]`);
                    }
                }
            } else {
                // --- Обычный режим: устанавливаем основное значение ---
                // Если значение уже такое, стираем его (повторный клик)
                if (cellData.value === num) {
                     cellData.value = 0;
                     console.log(`Удалено значение ${num} в [${selectedRow}, ${selectedCol}]`);
                } else {
                     cellData.value = num;
                     cellData.notes.clear(); // Стираем заметки при установке значения
                     console.log(`Введено значение ${num} в [${selectedRow}, ${selectedCol}]`);
                }
                // Опционально: снять выделение после ввода
                // clearSelection();
            }
             renderCell(selectedRow, selectedCol); // Перерисовать ячейку
        }
    });

     // Обработка нажатий клавиш
    document.addEventListener('keydown', (event) => {
        if (!selectedCell) return; // Игнорируем, если ячейка не выбрана

        const cellData = userGrid[selectedRow][selectedCol];
        let needsRender = false; // Флаг, нужно ли перерисовывать ячейку

        // Цифры 1-9
        if (event.key >= '1' && event.key <= '9') {
            clearErrors();
            const num = parseInt(event.key);
            if (isNoteMode) {
                if (cellData.value === 0) { // Только если нет основного значения
                    if (cellData.notes.has(num)) cellData.notes.delete(num);
                    else cellData.notes.add(num);
                    needsRender = true;
                }
            } else {
                if (cellData.value !== num) { // Ставим новое значение
                     cellData.value = num;
                     cellData.notes.clear();
                     needsRender = true;
                } else { // Повторное нажатие той же цифры - стираем
                    cellData.value = 0;
                    needsRender = true;
                }
            }
        }
        // Стирание
        else if (event.key === 'Backspace' || event.key === 'Delete') {
            clearErrors();
            if (cellData.value !== 0 || cellData.notes.size > 0) {
                cellData.value = 0;
                cellData.notes.clear();
                needsRender = true;
            }
        }
        // Переключение режима заметок клавишей 'N' или 'Т' (русская)
        else if (event.key.toLowerCase() === 'n' || event.key.toLowerCase() === 'т') {
             isNoteMode = !isNoteMode;
             updateNoteToggleButtonState();
             event.preventDefault(); // Предотвратить ввод буквы
             console.log("Режим заметок переключен клавиатурой:", isNoteMode ? "ВКЛ" : "ВЫКЛ");
        }

        // Перерисовываем ячейку, если были изменения
        if (needsRender) {
            renderCell(selectedRow, selectedCol);
        }
    });

    // Клик по кнопке "Проверить" (проверяет только основные значения)
    checkButton.addEventListener('click', () => {
        console.log("Нажата кнопка 'Проверить'");
        clearErrors();
        if (!currentSolution || !userGrid) return;

        let allCorrect = true;
        let boardComplete = true;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cellData = userGrid[r][c];
                const userValue = cellData.value; // Проверяем только .value
                const cellElement = boardElement.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
                if (!cellElement) continue;

                if (userValue === 0) { // Если нет основного значения - не завершено
                    boardComplete = false;
                } else if (!cellElement.classList.contains('given')) { // Проверяем только введенные
                    const solutionValue = getSolutionValue(r, c);
                    if (userValue !== solutionValue) {
                        cellElement.classList.add('incorrect'); // Подсветить ошибку
                        allCorrect = false;
                    }
                }
            }
        }
        // Вывод результата
        if (allCorrect && boardComplete) {
            statusMessageElement.textContent = "Поздравляем! Судоку решено верно!";
            statusMessageElement.className = 'correct';
            clearSelection();
        } else if (!allCorrect) {
            statusMessageElement.textContent = "Найдены ошибки. Неверные ячейки выделены.";
            statusMessageElement.className = 'incorrect-msg';
        } else {
             statusMessageElement.textContent = "Пока все верно, но поле не заполнено до конца.";
             statusMessageElement.className = '';
        }
    });

    // Клик по кнопке "Новая игра"
    newGameButton.addEventListener('click', () => {
        if (window.confirm("Начать новую игру? Текущий прогресс будет потерян.")) {
            initGame();
        }
    });

    // --- Инициализация Telegram Web App SDK ---
     try {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            console.log("Telegram WebApp SDK инициализирован.");
        } else {
            console.log("Telegram WebApp SDK не найден.");
        }
     } catch (e) {
         console.error("Ошибка инициализации Telegram WebApp SDK:", e);
     }

    // --- Первый запуск игры при загрузке ---
    initGame();

}); // Конец 'DOMContentLoaded'
