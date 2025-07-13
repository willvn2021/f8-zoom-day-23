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
const tabList = $(".tab-list");
const toastContainer = $("#toast-container");

let editIndex = null;
// const todoTasks = JSON.parse(localStorage.getItem("todoTasks")) || [];
const apiURL = "http://localhost:3000/tasks";
let editID = null;
let todoTasks = [];

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

// function saveTasks() {
//     localStorage.setItem("todoTasks", JSON.stringify(todoTasks));
// }

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
    // editIndex = null;
    editID = null;
}

function modalReset() {
    taskForm.reset();
}

taskAddBtn.onclick = modalOpen;
modalBtnClose.onclick = modalClose;
modalBtnCancel.onclick = modalClose;

// modalOverlay.onclick = modalClose;

// taskForm.onsubmit = function (e) {
taskForm.onsubmit = async function (e) {
    e.preventDefault();

    const requiredInput = {
        name: "Task Name",
        description: "Description",
        start_time: "Start Time",
        end_time: "End Time",
        due_date: "Due Date",
    };

    const formData = Object.fromEntries(new FormData(taskForm));

    for (const key in requiredInput) {
        if (!formData[key] || formData[key].trim() === "") {
            showToast(
                `Vui lòng nhập trường dữ liệu ${escapeHTML(
                    requiredInput[key]
                )}.`,
                "error"
            );
            return;
        }
    }

    if (editID) {
        await updateTask(editID, formData);
    } else {
        await createTask(formData);
    }
};

tabList.onclick = function (e) {
    const getAllTabs = tabList.querySelectorAll(".tab-button");
    const tabItem = e.target.closest(".tab-button");

    if (tabItem) {
        //Gỡ tất cả các class active rồi thêm vào khi có onclick
        getAllTabs.forEach((button) => button.classList.remove("active"));
        tabItem.classList.add("active");

        //Lấy Text trong HTML để đi so sánh
        const tabTextContent = tabItem.textContent;

        if (tabTextContent === "Completed") {
            const taskCards = taskGrid.querySelectorAll(".task-card");
            const allTaskArr = Array.from(taskCards);

            //Check nếu chưa có Task nào Completed
            const hasCompleted = todoTasks.filter((task) => task.isCompleted);
            if (!hasCompleted.length) {
                taskGrid.innerHTML = `<span>No Task Completed</span>`;
                return;
            }

            //Lọc ra các Class 'completed' trong danh sách task-card sau đó đem đi phủ định để ẩn đi
            allTaskArr.forEach((card) => {
                const isCompleted = card.classList.contains("completed");
                if (!isCompleted) card.hidden = true;
            });
        }

        if (tabTextContent === "Active Task") renderTask();
    }
};

taskGrid.onclick = function (e) {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const completeBtn = e.target.closest(".complete-btn");

    if (editBtn) {
        const taskId = editBtn.dataset.id;
        const task = todoTasks.find((task) => task.id == taskId);

        editID = taskId;

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
        const taskId = deleteBtn.dataset.id;

        if (confirm(`Are you sure you want to delete this?`)) {
            deleteTask(taskId);
        }
    }

    if (completeBtn) {
        const taskId = completeBtn.dataset.id;
        toggleComplete(taskId);
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
            (task) =>
        `
            <div class="task-card ${escapeHTML(task.color)} ${task.isCompleted ? "completed" : ""}" data-id="${task.id}">
                <div class="task-header">   
                    <h3 class="task-title">${escapeHTML(task.name)}</h3>
                    <button class="task-menu">
                        <i class="fa-solid fa-ellipsis fa-icon"></i>
                        <div class="dropdown-menu">
                            <div class="dropdown-item edit-btn" data-id="${task.id}">
                                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                                Edit
                            </div>
                            <div class="dropdown-item complete complete-btn" data-id="${task.id}">
                                <i class="fa-solid fa-check fa-icon"></i>
                                ${task.isCompleted ? "Mark as Active" : "Mark as Complete"}
                            </div>
                            <div class="dropdown-item delete delete-btn" data-id="${task.id}">
                                <i class="fa-solid fa-trash fa-icon"></i>
                                Delete
                            </div>
                        </div>
                    </button>
                </div>
                <p class="task-description">
                    ${escapeHTML(task.description)}
                </p>
                <div class="task-time">${escapeHTML(task.start_time)} - ${escapeHTML(task.end_time)}</div>
            </div>

        `
        )
        .join("");
    // prettier-ignore-end
    taskGrid.innerHTML = taskItems;
}

async function getTasks() {
    try {
        const res = await fetch(apiURL + "?_sort=id&_order=desc");
        const tasks = await res.json();
        todoTasks = tasks;
        renderTask();
    } catch (error) {
        console.error("Error fetching tasks:", error);
        showToast("Could not fetch tasks from the server.", "error");
    }
}

async function createTask(data) {
    try {
        const existingName = todoTasks.some(
            (task) => task.name.toLowerCase() === data.name.toLowerCase()
        );
        if (existingName) {
            showToast("Task name đã tồn tại. Vui lòng chọn tên khác.", "error");
            return;
        }
        data.isCompleted = false;
        const res = await fetch(apiURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const newTask = await res.json();

        todoTasks.unshift(newTask);
        renderTask();
        modalClose();
        showToast("Task đã được thêm mới thành công!", "success");
    } catch (error) {
        console.error("Error creating task:", error);
        showToast("Could not create task.", "error");
    }
}

async function updateTask(id, data) {
    try {
        const res = await fetch(`${apiURL}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const updateTask = await res.json();

        const index = todoTasks.findIndex((task) => task.id === id);
        if (index !== -1) todoTasks[index] = updateTask;
        renderTask();
        modalClose();
        showToast("Task đã được cập nhật thành công!", "success");
    } catch (error) {
        console.error("Error updating task:", error);
        showToast("Could not update task.", "error");
    }
}

async function deleteTask(id) {
    try {
        await fetch(`${apiURL}/${id}`, { method: "DELETE" });
        const index = todoTasks.findIndex((task) => task.id === id);
        if (index !== -1) todoTasks.splice(index, 1);
        renderTask();
        showToast("Task đã được xóa thành công!", "success");
    } catch (error) {
        console.error("Error deleting task:", error);
        showToast("Could not delete task.", "error");
    }
}

async function toggleComplete(id) {
    const task = todoTasks.find((task) => task.id === id);
    if (!task) return;

    const newStatus = !task.isCompleted;
    try {
        const res = await fetch(`${apiURL}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ isCompleted: newStatus }),
        });
        const updateTask = await res.json();

        const index = todoTasks.findIndex((task) => task.id == id);
        if (index !== -1) todoTasks[index] = updateTask;
        renderTask();
        showToast(
            `Task đã được đánh dấu ${
                updatedTask.isCompleted ? "Hoàn thành" : "Chờ thực hiện"
            }!`,
            "success"
        );
    } catch (error) {
        console.error("Error toggling complete status:", error);
        showToast("Could not toggle complete status.", "error");
    }
}

function start() {
    getTasks();
}

function escapeHTML(html) {
    const div = document.createElement("div");
    div.textContent = html;

    return div.innerHTML;
}

function showToast(message, type, duration = 3000) {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);

    const messageElement = document.createElement("span");
    messageElement.classList.add("toast-message");
    messageElement.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.classList.add("toast-close-btn");
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 500);
    };

    toast.appendChild(messageElement);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);
    toast.offsetHeight; // Trigger reflow
    toast.classList.add("show");

    setTimeout(() => closeBtn.click(), duration);
}

start();
