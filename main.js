const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const taskAddBtn = $(".add-btn");
const modalBtnClose = $(".modal-close");
const modalBtnCancel = $(".modal-cancel");
const modalOverlay = $("#addTaskModal");
const taskForm = $(".todo-app-form");
const taskTitle = $("#taskTitle");
const taskGrid = $("#todoList");
const searchInput = $(".search-input");

searchInput.oninput = function (e) {
    const value = e.target.value.trim().toLowerCase();
    const taskCards = taskGrid.querySelectorAll(".task-card");
    const allTaskArr = Array.from(taskCards);

    const filteredTaskCards = allTaskArr.filter((card) => {
        const title = card
            .querySelector(".task-title")
            .textContent.toLowerCase();
        const description = card
            .querySelector(".task-description")
            .textContent.toLowerCase();
        const searchResult =
            title.includes(value) || description.includes(value);
        return searchResult;
    });

    allTaskArr.forEach((card) => {
        // card.style.display = filteredTaskCards.includes(card) ? "" : "none";
        card.hidden = !filteredTaskCards.includes(card);
    });
};
let editIndex = null;

const todoTasks = JSON.parse(localStorage.getItem("todoTasks")) || [];

function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(todoTasks));
}

function modalOpen() {
    modalOverlay.className = "modal-overlay show";

    setTimeout(() => {
        taskTitle.focus();
    }, 300);
}

// modalOpen();

function modalClose() {
    modalOverlay.className = "modal-overlay";

    const formTitle = modalOverlay.querySelector(".modal-title");
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original || formTitle.textContent;
        delete formTitle.dataset.original;
    }

    const btnSubmit = modalOverlay.querySelector(".btn-submit");
    if (btnSubmit) {
        btnSubmit.textContent =
            btnSubmit.dataset.original || btnSubmit.textContent;
        delete btnSubmit.dataset.original;
    }

    const modal = modalOverlay.querySelector(".modal");
    setTimeout(() => {
        modal.scrollTop = 0;
    }, 300);

    modalReset();
    editIndex = null;
}

function modalReset() {
    taskForm.reset();
}

taskAddBtn.onclick = modalOpen;

modalBtnClose.onclick = modalClose;
modalBtnCancel.onclick = modalClose;

// modalOverlay.onclick = modalClose;

taskForm.onsubmit = function (e) {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(taskForm));
    if (editIndex) {
        todoTasks[editIndex] = formData;
    } else {
        formData.isCompleted = false;
        todoTasks.unshift(formData);
    }

    saveTasks();
    modalReset();
    modalClose();
    renderTask();
};

taskGrid.onclick = function (e) {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const completeBtn = e.target.closest(".complete-btn");

    if (editBtn) {
        const taskIndex = +editBtn.dataset.index;
        const task = todoTasks[taskIndex];

        editIndex = taskIndex;

        for (const key in task) {
            const value = task[key];
            const input = $(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        }

        const formTitle = modalOverlay.querySelector(".modal-title");
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = "Edit Task";
        }

        const btnSubmit = modalOverlay.querySelector(".btn-submit");
        if (btnSubmit) {
            btnSubmit.dataset.original = btnSubmit.textContent;
            btnSubmit.textContent = "Save";
        }

        modalOpen();
    }

    if (deleteBtn) {
        const taskIndex = +deleteBtn.dataset.index;
        const task = todoTasks[taskIndex];

        if (confirm(`Are you sure you want to delete this?`)) {
            todoTasks.splice(taskIndex, 1);

            saveTasks();
            renderTask();
        }
    }

    if (completeBtn) {
        const taskIndex = +completeBtn.dataset.index;
        const task = todoTasks[taskIndex];

        task.isCompleted = !task.isCompleted;

        saveTasks();
        renderTask();
    }
};

function renderTask() {
    if (!todoTasks.length) {
        taskGrid.innerHTML = `
            <span>No Task</span>
        `;
        return;
    }

    const taskItems = todoTasks
        .map(
            // prettier-ignore
            (task, index) => `          

            <div class="task-card ${task.color} ${task.isCompleted ? "completed" : ""}" data-index="${index}">
                <div class="task-header">
                    <h3 class="task-title">${task.name}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item edit-btn" data-index="${index}">
                                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete complete-btn" data-index="${index}">
                                <i class="fa-solid fa-check fa-icon"></i>
                                ${task.isCompleted ? "Mark as Active" : "Mark as Complete"}
                            </div>
                            <div class="dropdown-item delete delete-btn" data-index="${index}">
                                <i class="fa-solid fa-trash fa-icon"></i>
                                Delete
                            </div>
                        </div>
                    </button>
                </div>
                <p class="task-description">
                    ${task.description}
                </p>
                <div class="task-time">${task.start_time} - ${task.end_time}</div>
            </div>

        `
        )
        .join("");
    // prettier-ignore-end
    taskGrid.innerHTML = taskItems;
}

renderTask();
