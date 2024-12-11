// 添加日期相关变量
let currentDate = new Date();
let currentDateKey = formatDateKey(currentDate);
let dateCheckInterval;

// 检查日期变化的函数
function checkDateChange() {
    const newDate = new Date();
    const newDateKey = formatDateKey(newDate);
    
    if (newDateKey !== currentDateKey) {
        // 日期已变化，更新相关变量
        currentDate = newDate;
        currentDateKey = newDateKey;
        
        // 初始化新日期的数据结构
        if (!dailyData[currentDateKey]) {
            dailyData[currentDateKey] = {
                timelineData: {},
                freeNotes: [],
                frogTasks: [null, null, null]
            };
        }
        
        // 重新加载页面数据
        loadDailyData();
        updateDateDisplay();
    }
}

// 修改数据结构
let dailyData = JSON.parse(localStorage.getItem('dailyData')) || {};
if (!dailyData[currentDateKey]) {
    dailyData[currentDateKey] = {
        timelineData: {},
        freeNotes: [],
        frogTasks: [null, null, null]
    };
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    initializeDate();
    initializeTimeline();
    initializeFrogTasks();
    initializeFreeArea();
    loadDailyData();
    initializeHeaderMenu();
    initializeDialogs();
    
    // 添加日期检查定时器
    dateCheckInterval = setInterval(checkDateChange, 1000 * 60); // 每分钟检查一次
    
    // 添加页面关闭时的清理
    window.addEventListener('beforeunload', () => {
        if (dateCheckInterval) {
            clearInterval(dateCheckInterval);
        }
    });
});

// 格式化日期
function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = '日一二三四五六'.charAt(date.getDay());
    return `${month}月${day}日 周${weekday}`;
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 初始化日期显示
function initializeDate() {
    const dateElement = document.getElementById('current-date');
    updateDateDisplay();
    
    dateElement.addEventListener('click', () => {
        // 移除已存在的日期选择器
        const existingPicker = document.querySelector('.date-picker');
        if (existingPicker) {
            existingPicker.remove();
            return;
        }

        // 创建日期选择器容器
        const picker = document.createElement('div');
        picker.className = 'date-picker';
        
        // 创建月份选择器
        const monthSelect = document.createElement('select');
        monthSelect.className = 'date-picker-select month';
        const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
        
        // 创建年份选择器
        const yearSelect = document.createElement('select');
        yearSelect.className = 'date-picker-select year';
        const currentYear = currentDate.getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            yearSelect.appendChild(option);
        }
        
        // 设置当前选中的月份和年份
        monthSelect.value = currentDate.getMonth();
        yearSelect.value = currentDate.getFullYear();
        
        // 创建日期网格
        const daysContainer = document.createElement('div');
        daysContainer.className = 'date-picker-days';
        
        // 添加星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'date-picker-weekday';
            dayElement.textContent = day;
            daysContainer.appendChild(dayElement);
        });
        
        // 更新日期网格的函数
        function updateDaysGrid() {
            // 清除现有的日期按钮
            const existingDays = daysContainer.querySelectorAll('.date-picker-day');
            existingDays.forEach(day => {
                if (day.parentNode === daysContainer) {
                    daysContainer.removeChild(day);
                }
            });
            
            const year = parseInt(yearSelect.value);
            const month = parseInt(monthSelect.value);
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startPadding = firstDay.getDay();
            
            // 添加上个月的填充日期
            for (let i = 0; i < startPadding; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'date-picker-day padding';
                daysContainer.appendChild(dayElement);
            }
            
            // 添加当月的日期
            for (let date = 1; date <= lastDay.getDate(); date++) {
                const dayElement = document.createElement('button');
                dayElement.className = 'date-picker-day';
                dayElement.textContent = date;
                
                // 检查是否是当前选中的日期
                const thisDate = new Date(year, month, date);
                const thisDateKey = formatDateKey(thisDate);
                if (thisDateKey === currentDateKey) {
                    dayElement.classList.add('selected');
                }
                
                // 添加点击事件
                dayElement.addEventListener('click', () => {
                    const newDate = new Date(year, month, date);
                    const newDateKey = formatDateKey(newDate);
                    
                    // 保存当前日期的数据
                    saveToLocalStorage();
                    
                    // 更新当前日期
                    currentDate = newDate;
                    currentDateKey = newDateKey;
                    
                    // 确保新日期的数据结构存在
                    if (!dailyData[currentDateKey]) {
                        dailyData[currentDateKey] = {
                            timelineData: {},
                            freeNotes: [],
                            frogTasks: [null, null, null]
                        };
                    }
                    
                    updateDateDisplay();
                    loadDailyData();
                    picker.remove();
                });
                
                daysContainer.appendChild(dayElement);
            }
        }
        
        // 当月份或年份改变时更新日期网格
        monthSelect.addEventListener('change', updateDaysGrid);
        yearSelect.addEventListener('change', updateDaysGrid);
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'date-picker-buttons';
        
        // 创建今天按钮
        const todayBtn = document.createElement('button');
        todayBtn.textContent = '今天';
        todayBtn.className = 'date-picker-btn today';
        
        // 添加今天按钮的点击事件
        todayBtn.addEventListener('click', () => {
            const newDate = new Date();
            const newDateKey = formatDateKey(newDate);
            
            // 保存当前日期的数据
            saveToLocalStorage();
            
            // 更新当前日期
            currentDate = newDate;
            currentDateKey = newDateKey;
            
            // 确保新日期的数据结构存在
            if (!dailyData[currentDateKey]) {
                dailyData[currentDateKey] = {
                    timelineData: {},
                    freeNotes: [],
                    frogTasks: [null, null, null]
                };
            }
            
            updateDateDisplay();
            loadDailyData();
            picker.remove();
        });
        
        // 组装日期选择器
        const selectContainer = document.createElement('div');
        selectContainer.className = 'date-picker-header';
        selectContainer.appendChild(yearSelect);
        selectContainer.appendChild(monthSelect);
        
        picker.appendChild(selectContainer);
        picker.appendChild(daysContainer);
        picker.appendChild(buttonContainer);
        buttonContainer.appendChild(todayBtn);
        
        // 初始化日期网格
        updateDaysGrid();
        
        // 定位日期选择器
        const rect = dateElement.getBoundingClientRect();
        picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        picker.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(picker);
        
        // 点击其他地方关闭日期选择器
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target) && e.target !== dateElement) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        });
    });
}

// 更新日期显示
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    dateElement.textContent = formatDate(currentDate);
}

// 初始化时间轴
function initializeTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '';

    // 创建时间槽
    for (let hour = 6; hour <= 22; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';

        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = `${hour}:00`;

        const timeContent = document.createElement('div');
        timeContent.className = 'time-content';
        timeContent.contentEditable = true;
        timeContent.dataset.time = `${hour}:00`;

        // 从localStorage加载内容
        if (dailyData[currentDateKey] && dailyData[currentDateKey].timelineData[hour]) {
            timeContent.textContent = dailyData[currentDateKey].timelineData[hour];
        }

        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'timeline-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = '清除内容';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            const hour = timeContent.dataset.time.split(':')[0];
            const oldContent = dailyData[currentDateKey].timelineData[hour];
            
            timeContent.textContent = '';
            dailyData[currentDateKey].timelineData[hour] = '';
            
            // 检查并更新相关的青蛙任务
            const frogTaskIndex = dailyData[currentDateKey].frogTasks.findIndex(
                task => task && task.content === oldContent
            );
            if (frogTaskIndex !== -1) {
                dailyData[currentDateKey].frogTasks[frogTaskIndex] = null;
                updateFrogTasks();
            }
            
            saveToLocalStorage();
        };

        // 内容变化时保存
        timeContent.addEventListener('blur', (e) => {
            const hour = e.target.dataset.time.split(':')[0];
            const oldContent = dailyData[currentDateKey].timelineData[hour];
            const newContent = e.target.textContent.trim();
            
            // 更新时间轴数据
            dailyData[currentDateKey].timelineData[hour] = newContent;
            
            // 只有当内容存在于青蛙任务中时才询问是否更新
            const frogTaskIndex = dailyData[currentDateKey].frogTasks.findIndex(
                task => task && task.content === oldContent
            );
            if (frogTaskIndex !== -1 && oldContent && oldContent !== newContent) {
                if (confirm(`是否同步更新"三要事"中的相同内容？\n原内容：${oldContent}\n新内容：${newContent}`)) {
                    dailyData[currentDateKey].frogTasks[frogTaskIndex].content = newContent;
                    updateFrogTasks();
                }
            }
            
            saveToLocalStorage();
        });

        // 添加拖拽功能
        timeContent.setAttribute('draggable', true);
        timeContent.addEventListener('dragstart', handleDragStart);

        // 添加元素到时间槽
        timeSlot.appendChild(timeLabel);
        timeSlot.appendChild(timeContent);
        timeSlot.appendChild(deleteBtn);
        timelineContainer.appendChild(timeSlot);
    }
}

// 初始化自由区域
function initializeFreeArea() {
    const freeArea = document.getElementById('free-area');
    
    // 点击空白处添加新便签
    freeArea.addEventListener('click', (e) => {
        if (e.target === freeArea) {
            const rect = freeArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createNote(x, y);
        }
    });
}

// 生成唯一ID的辅助函数
function generateUniqueId() {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 创建新便签
function createNote(x, y, content = '', id = null) {
    const note = document.createElement('div');
    note.className = 'note';
    
    // 使用传入的ID或生成新ID
    const noteId = id || generateUniqueId();
    note.dataset.noteId = noteId;
    
    // 创建便签头部
    const header = document.createElement('div');
    header.className = 'note-header';
    header.style.cursor = 'grab';
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-note';
    deleteBtn.innerHTML = '✕';
    deleteBtn.onclick = () => deleteNote(note);
    
    // 创建便签内容区域
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';
    contentDiv.contentEditable = true;
    contentDiv.textContent = content;
    
    // 保存内容
    contentDiv.addEventListener('blur', () => {
        saveNotePosition(note);
    });
    
    // 组装便签
    header.appendChild(deleteBtn);
    note.appendChild(header);
    note.appendChild(contentDiv);
    
    // 设置位置
    note.style.left = x + 'px';
    note.style.top = y + 'px';
    
    document.getElementById('free-area').appendChild(note);
    makeDraggable(note);
    makeNoteDraggableToFrogs(note);
    
    // 保存新便签
    if (!id) {
        dailyData[currentDateKey].freeNotes.push({
            id: noteId,
            content: content,
            x: x,
            y: y
        });
        saveToLocalStorage();
    }
    
    return note;
}

// 修改便签拖拽逻辑
function makeDraggable(element) {
    const header = element.querySelector('.note-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        
        e.preventDefault();
        isDragging = true;
        header.style.cursor = 'grabbing';
        
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;
        
        // 存储开始拖拽时的位置
        element.dataset.originalPosition = `${element.style.left},${element.style.top}`;
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialLeft + deltaX;
            let newY = initialTop + deltaY;
            
            // 添加边界限制
            const freeArea = document.getElementById('free-area');
            const rect = freeArea.getBoundingClientRect();
            const maxX = rect.width - element.offsetWidth;
            const maxY = rect.height - element.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        }
        
        function onMouseUp() {
            if (!isDragging) return;
            
            isDragging = false;
            header.style.cursor = 'grab';
            
            saveNotePosition(element);
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    // 防止默认的拖拽行为
    header.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
    
    // 防止文本选中
    header.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
}

// 修改保存便签位置的函数
function saveNotePosition(element) {
    const noteId = element.dataset.noteId;
    if (!noteId) return;
    
    const notes = dailyData[currentDateKey].freeNotes;
    const noteIndex = notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex].x = parseInt(element.style.left) || 0;
        notes[noteIndex].y = parseInt(element.style.top) || 0;
        notes[noteIndex].content = element.querySelector('.note-content').textContent;
        saveToLocalStorage();
    }
}

// 修改便签与青蛙区域交互
function makeNoteDraggableToFrogs(note) {
    const header = note.querySelector('.note-header');
    let longPressTimer = null;
    let isDraggingToFrog = false;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-note')) return;
        
        longPressTimer = setTimeout(() => {
            isDraggingToFrog = true;
            note.setAttribute('draggable', true);
            header.style.cursor = 'move';
            
            // 添加拖拽时的视觉反馈
            note.classList.add('dragging-to-frog');
        }, 200);
    });

    header.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
        if (isDraggingToFrog) {
            note.removeAttribute('draggable');
            header.style.cursor = 'grab';
            note.classList.remove('dragging-to-frog');
            isDraggingToFrog = false;
        }
    });

    note.addEventListener('dragstart', (e) => {
        if (!isDraggingToFrog) return;
        e.dataTransfer.setData('text/plain', note.querySelector('.note-content').textContent);
        e.dataTransfer.setData('note-id', note.dataset.noteId);
        note.classList.add('dragging');
    });

    note.addEventListener('dragend', () => {
        note.classList.remove('dragging');
        note.classList.remove('dragging-to-frog');
        note.removeAttribute('draggable');
        header.style.cursor = 'grab';
        isDraggingToFrog = false;
    });
}

// 添加 handleDragEnd 函数
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// 修改便签的删除处理
function deleteNote(note) {
    const noteId = note.dataset.noteId;
    
    // 清除对应的青蛙任务
    dailyData[currentDateKey].frogTasks = dailyData[currentDateKey].frogTasks.map(task => 
        task && task.noteId === noteId ? null : task
    );
    updateFrogTasks();
    
    // 删除便签
    note.remove();
    const noteIndex = dailyData[currentDateKey].freeNotes.findIndex(n => n.id === noteId);
    if (noteIndex > -1) {
        dailyData[currentDateKey].freeNotes.splice(noteIndex, 1);
        saveToLocalStorage();
    }
}

// 处理时间轴拖拽
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const draggedElement = document.querySelector('.dragging');
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
}

// 修改青蛙区域的拖放处理
function initializeFrogTasks() {
    const frogTasks = document.querySelectorAll('.frog-task');
    
    frogTasks.forEach((task, index) => {
        // 添加点击事件监听器
        task.addEventListener('click', (e) => {
            // 如果点击的是删除按钮，则不显示菜单
            if (e.target.classList.contains('delete-task')) {
                return;
            }
            showTaskMenu(task, index);
        });

        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', () => clearTask(index));
        task.appendChild(deleteBtn);
        
        // 拖放相关事件
        task.addEventListener('dragover', (e) => {
            e.preventDefault();
            task.classList.add('drag-over');
        });
        
        task.addEventListener('dragleave', () => {
            task.classList.remove('drag-over');
        });
        
        task.addEventListener('drop', (e) => {
            e.preventDefault();
            task.classList.remove('drag-over');
            
            const draggedNoteId = e.dataTransfer.getData('text/plain');
            if (draggedNoteId) {
                const note = document.querySelector(`[data-id="${draggedNoteId}"]`);
                if (note) {
                    setTask(index, note.querySelector('.note-content').textContent, draggedNoteId);
                }
            } else {
                const timeContent = e.dataTransfer.getData('timeline/content');
                if (timeContent) {
                    setTask(index, timeContent);
                }
            }
        });
    });
    
    // 初始化显示任务
    updateFrogTasks();
}

function setTask(index, content, noteId = null) {
    // 保存任务内容和来源信息
    dailyData[currentDateKey].frogTasks[index] = {
        content: content,
        timestamp: Date.now(),
        noteId: noteId  
    };
    updateFrogTasks();
    saveToLocalStorage();
}

function updateFrogTasks() {
    const taskContents = document.querySelectorAll('.task-content');
    dailyData[currentDateKey].frogTasks.forEach((task, index) => {
        const taskContent = taskContents[index];
        if (task && task.content) {
            taskContent.textContent = task.content;
            taskContent.classList.add('has-content');
            // 如果任务关联了便签，检查便签是否还存在
            if (task.noteId) {
                const noteExists = dailyData[currentDateKey].freeNotes.some(note => note.id === task.noteId);
                if (!noteExists) {
                    // 如果便签不存在，清除任务
                    dailyData[currentDateKey].frogTasks[index] = null;
                    taskContent.textContent = '点击设置重要事项';
                    taskContent.classList.remove('has-content');
                }
            }
        } else {
            taskContent.textContent = '点击设置重要事项';
            taskContent.classList.remove('has-content');
        }
    });
    saveToLocalStorage();
}

// 修改显示任务菜单的函数
function showTaskMenu(task, taskIndex) {
    const existingMenu = document.querySelector('.task-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'task-menu';
    
    // 创建菜单内容
    let menuHtml = `
        <div class="menu-section">
            <div class="menu-header">
                <h3>手动输入</h3>
                <div class="input-group">
                    <input type="text" placeholder="输入任务内容" class="task-input">
                    <button class="save-btn">保存</button>
                </div>
            </div>
        </div>
        <div class="menu-section">
            <h3>便签内容</h3>
            <div class="notes-list">
    `;
    
    // 添加便签内容
    const notes = dailyData[currentDateKey].freeNotes;
    if (notes.length > 0) {
        notes.forEach(note => {
            if (note.content.trim()) {
                menuHtml += `<div class="menu-item" data-type="note" data-id="${note.id}">${note.content}</div>`;
            }
        });
    } else {
        menuHtml += '<div class="menu-empty">暂无便签</div>';
    }
    
    menuHtml += `
            </div>
        </div>
        <div class="menu-section">
            <h3>时间轴内容</h3>
            <div class="timeline-list">
    `;
    
    // 添加时间轴内容
    const timelineItems = dailyData[currentDateKey].timelineData;
    let hasTimelineItems = false;
    
    Object.entries(timelineItems).forEach(([hour, content]) => {
        if (content && content.trim()) {
            hasTimelineItems = true;
            menuHtml += `
                <div class="menu-item" data-type="timeline" data-hour="${hour}">
                    <span class="time-label">${hour}:00</span>
                    <span class="content">${content}</span>
                </div>
            `;
        }
    });
    
    if (!hasTimelineItems) {
        menuHtml += '<div class="menu-empty">暂无时间轴内容</div>';
    }
    
    menuHtml += `
            </div>
        </div>
    `;
    
    menu.innerHTML = menuHtml;
    
    // 添加事件监听
    const input = menu.querySelector('.task-input');
    const saveBtn = menu.querySelector('.save-btn');
    
    // 手动输入保存
    function saveInput() {
        const value = input.value.trim();
        if (value) {
            setTask(taskIndex, value);
            menu.remove();
        }
    }
    
    saveBtn.addEventListener('click', saveInput);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveInput();
        }
    });
    
    // 点击菜单项
    menu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;
        
        const type = menuItem.dataset.type;
        if (type === 'note') {
            const noteId = menuItem.dataset.id;
            const note = notes.find(n => n.id === noteId);
            if (note) {
                setTask(taskIndex, note.content, noteId);
            }
        } else if (type === 'timeline') {
            const hour = menuItem.dataset.hour;
            const content = timelineItems[hour];
            if (content) {
                setTask(taskIndex, content);
            }
        }
        menu.remove();
    });
    
    // 定位菜单
    const rect = task.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    
    // 关闭菜单的函数
    function closeMenu(e) {
        if (!menu.contains(e.target) && !task.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }
    
    document.body.appendChild(menu);
    input.focus(); // 自动聚焦到输入框
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function clearTask(index) {
    dailyData[currentDateKey].frogTasks[index] = null;
    updateFrogTasks();
    saveToLocalStorage();
}

// 加载当日数据
function loadDailyData() {
    // 清空现有内容
    document.getElementById('timeline-container').innerHTML = '';
    document.getElementById('free-area').innerHTML = '';
    
    // 加载时间轴数据
    initializeTimeline();
    
    // 加载便签
    const notes = dailyData[currentDateKey].freeNotes || [];
    notes.forEach(note => {
        createNote(note.x, note.y, note.content, note.id);
    });
    
    // 加载青蛙任务
    const taskContents = document.querySelectorAll('.task-content');
    dailyData[currentDateKey].frogTasks.forEach((task, index) => {
        const taskContent = taskContents[index];
        if (task && task.content) {
            taskContent.textContent = task.content;
            taskContent.classList.add('has-content');
        } else {
            taskContent.textContent = '点击设置重要事项';
            taskContent.classList.remove('has-content');
        }
    });
}

// 修改保存函数
function saveToLocalStorage() {
    localStorage.setItem('dailyData', JSON.stringify(dailyData));
}

// 初始化日期显示
function initializeDate() {
    const dateElement = document.getElementById('current-date');
    updateDateDisplay();
    
    dateElement.addEventListener('click', () => {
        // 移除已存在的日期选择器
        const existingPicker = document.querySelector('.date-picker');
        if (existingPicker) {
            existingPicker.remove();
            return;
        }

        // 创建日期选择器容器
        const picker = document.createElement('div');
        picker.className = 'date-picker';
        
        // 创建月份选择器
        const monthSelect = document.createElement('select');
        monthSelect.className = 'date-picker-select month';
        const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
        
        // 创建年份选择器
        const yearSelect = document.createElement('select');
        yearSelect.className = 'date-picker-select year';
        const currentYear = currentDate.getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            yearSelect.appendChild(option);
        }
        
        // 设置当前选中的月份和年份
        monthSelect.value = currentDate.getMonth();
        yearSelect.value = currentDate.getFullYear();
        
        // 创建日期网格
        const daysContainer = document.createElement('div');
        daysContainer.className = 'date-picker-days';
        
        // 添加星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'date-picker-weekday';
            dayElement.textContent = day;
            daysContainer.appendChild(dayElement);
        });
        
        // 更新日期网格的函数
        function updateDaysGrid() {
            // 清除现有的日期按钮
            const existingDays = daysContainer.querySelectorAll('.date-picker-day');
            existingDays.forEach(day => {
                if (day.parentNode === daysContainer) {
                    daysContainer.removeChild(day);
                }
            });
            
            const year = parseInt(yearSelect.value);
            const month = parseInt(monthSelect.value);
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startPadding = firstDay.getDay();
            
            // 添加上个月的填充日期
            for (let i = 0; i < startPadding; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'date-picker-day padding';
                daysContainer.appendChild(dayElement);
            }
            
            // 添加当月的日期
            for (let date = 1; date <= lastDay.getDate(); date++) {
                const dayElement = document.createElement('button');
                dayElement.className = 'date-picker-day';
                dayElement.textContent = date;
                
                // 检查是否是当前选中的日期
                const thisDate = new Date(year, month, date);
                const thisDateKey = formatDateKey(thisDate);
                if (thisDateKey === currentDateKey) {
                    dayElement.classList.add('selected');
                }
                
                // 添加点击事件
                dayElement.addEventListener('click', () => {
                    const newDate = new Date(year, month, date);
                    const newDateKey = formatDateKey(newDate);
                    
                    // 保存当前日期的数据
                    saveToLocalStorage();
                    
                    // 更新当前日期
                    currentDate = newDate;
                    currentDateKey = newDateKey;
                    
                    // 确保新日期的数据结构存在
                    if (!dailyData[currentDateKey]) {
                        dailyData[currentDateKey] = {
                            timelineData: {},
                            freeNotes: [],
                            frogTasks: [null, null, null]
                        };
                    }
                    
                    updateDateDisplay();
                    loadDailyData();
                    picker.remove();
                });
                
                daysContainer.appendChild(dayElement);
            }
        }
        
        // 当月份或年份改变时更新日期网格
        monthSelect.addEventListener('change', updateDaysGrid);
        yearSelect.addEventListener('change', updateDaysGrid);
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'date-picker-buttons';
        
        // 创建今天按钮
        const todayBtn = document.createElement('button');
        todayBtn.textContent = '今天';
        todayBtn.className = 'date-picker-btn today';
        
        // 添加今天按钮的点击事件
        todayBtn.addEventListener('click', () => {
            const newDate = new Date();
            const newDateKey = formatDateKey(newDate);
            
            // 保存当前日期的数据
            saveToLocalStorage();
            
            // 更新当前日期
            currentDate = newDate;
            currentDateKey = newDateKey;
            
            // 确保新日期的数据结构存在
            if (!dailyData[currentDateKey]) {
                dailyData[currentDateKey] = {
                    timelineData: {},
                    freeNotes: [],
                    frogTasks: [null, null, null]
                };
            }
            
            updateDateDisplay();
            loadDailyData();
            picker.remove();
        });
        
        // 组装日期选择器
        const selectContainer = document.createElement('div');
        selectContainer.className = 'date-picker-header';
        selectContainer.appendChild(yearSelect);
        selectContainer.appendChild(monthSelect);
        
        picker.appendChild(selectContainer);
        picker.appendChild(daysContainer);
        picker.appendChild(buttonContainer);
        buttonContainer.appendChild(todayBtn);
        
        // 初始化日期网格
        updateDaysGrid();
        
        // 定位日期选择器
        const rect = dateElement.getBoundingClientRect();
        picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        picker.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(picker);
        
        // 点击其他地方关闭日期选择器
        document.addEventListener('click', function closePicker(e) {
            if (!picker.contains(e.target) && e.target !== dateElement) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        });
    });
}

// 添加更新日期显示的辅助函数
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    dateElement.textContent = formatDate(currentDate);
}

// 添加清除数据的函数
function clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复。')) {
        return;
    }
    
    // 保存一个备份，以便可能的撤销
    const dataBackup = JSON.stringify(dailyData);
    localStorage.setItem('dailyData_backup', dataBackup);
    
    // 清除数据
    dailyData = {};
    localStorage.removeItem('dailyData');
    
    // 显示撤销选项
    showUndoOption();
    
    // 重新初始化页面数据
    currentDate = new Date();
    currentDateKey = formatDateKey(currentDate);
    if (!dailyData[currentDateKey]) {
        dailyData[currentDateKey] = {
            timelineData: {},
            freeNotes: [],
            frogTasks: [null, null, null]
        };
    }
    
    // 重新加载页面数据
    loadDailyData();
}

// 显示撤销选项
function showUndoOption() {
    const undoDiv = document.createElement('div');
    undoDiv.className = 'undo-option';
    undoDiv.innerHTML = `
        <span>数据已清除</span>
        <button id="undoClear">撤销清除</button>
    `;
    document.body.appendChild(undoDiv);
    
    // 设置自动消失
    const timeout = setTimeout(() => {
        undoDiv.remove();
        localStorage.removeItem('dailyData_backup');
    }, 10000); // 10秒后消失
    
    // 添加撤销功能
    document.getElementById('undoClear').addEventListener('click', () => {
        const backup = localStorage.getItem('dailyData_backup');
        if (backup) {
            dailyData = JSON.parse(backup);
            localStorage.setItem('dailyData', backup);
            localStorage.removeItem('dailyData_backup');
            loadDailyData();
            undoDiv.remove();
            clearTimeout(timeout);
        }
    });
}

// 添加菜单初始化函数
function initializeHeaderMenu() {
    const menuTrigger = document.getElementById('menuTrigger');
    const headerMenu = document.getElementById('headerMenu');
    const clearAllData = document.getElementById('clearAllData');

    // 点击菜单按钮显示/隐藏菜单
    menuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        headerMenu.classList.toggle('show');
    });

    // 点击菜单项
    clearAllData.addEventListener('click', () => {
        headerMenu.classList.remove('show');
        clearAllData();
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', (e) => {
        if (!headerMenu.contains(e.target) && !menuTrigger.contains(e.target)) {
            headerMenu.classList.remove('show');
        }
    });
}

// 初始化对话框
function initializeDialogs() {
    const guideDialog = document.getElementById('guideDialog');
    const aboutDialog = document.getElementById('aboutDialog');
    const showGuideButton = document.getElementById('showGuide');
    const showAboutButton = document.getElementById('showAbout');
    const closeButtons = document.querySelectorAll('.dialog-close');
    
    // 显示新手指南
    showGuideButton.addEventListener('click', () => {
        guideDialog.classList.add('show');
        headerMenu.classList.remove('show');
    });
    
    // 显示关于信息
    showAboutButton.addEventListener('click', () => {
        aboutDialog.classList.add('show');
        headerMenu.classList.remove('show');
    });
    
    // 关闭按钮事件
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            guideDialog.classList.remove('show');
            aboutDialog.classList.remove('show');
        });
    });
    
    // 点击背景关闭对话框
    [guideDialog, aboutDialog].forEach(dialog => {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('show');
            }
        });
    });
}