// ============================================
// UTILITY FUNCTIONS
// ============================================

// Приводит каждое слово к заглавной букве
function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Форматирует ФИО: каждое слово с заглавной
function formatFullName(input) {
    if (!input) return '';
    let val = input.value.trim();
    let words = val.split(/\s+/);
    words = words.map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    });
    input.value = words.join(' ');
}

// Извлекает фамилии из любой строки (разделители: запятая, пробел, слэш, точка с запятой и т.д.)
function extractSurnames(input) {
    if (!input) return [];
    let val = input.trim();
    // Заменяем все возможные разделители на запятую
    val = val.replace(/[;\/\\|.]+/g, ',');
    // Разбиваем по запятым
    let parts = val.split(',').map(s => s.trim());
    // Если нет запятых, разбиваем по пробелам
    if (parts.length === 1 && !val.includes(',')) {
        parts = val.split(/\s+/).filter(s => s.length > 0);
    }
    // Удаляем пустые и форматируем
    parts = parts.filter(s => s.length > 0);
    // Каждую фамилию с заглавной
    parts = parts.map(s => capitalizeWords(s));
    return parts;
}

// Проверяет ФИО (минимум 3 слова)
function validateFullName(name) {
    if (!name) return false;
    const parts = name.trim().split(/\s+/);
    return parts.length >= 3 && parts.every(p => p.length >= 2);
}

// Проверяет, что введены фамилии
function validateSurnames(input) {
    const surnames = extractSurnames(input);
    return surnames.length > 0;
}

// ============================================
// STEP MANAGEMENT
// ============================================
let currentStep = 0;
const totalSteps = 4;

function updateProgress(step) {
    for (let i = 0; i < totalSteps; i++) {
        const circle = document.getElementById(`stepCircle${i}`);
        const label = document.getElementById(`stepLabel${i}`);
        circle.classList.remove('active', 'completed');
        label.classList.remove('active');
        if (i < step) {
            circle.classList.add('completed');
            circle.textContent = '✓';
        } else if (i === step) {
            circle.classList.add('active');
            circle.textContent = i + 1;
        } else {
            circle.textContent = i + 1;
        }
        if (i === step) {
            label.classList.add('active');
        }
    }
}

function showStep(step) {
    document.querySelectorAll('.step').forEach((el, i) => {
        el.classList.toggle('active', i === step);
    });
    updateProgress(step);
    currentStep = step;
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToStep(step) {
    let canGo = true;
    for (let s = 0; s < step; s++) {
        if (!validateStep(s, true)) {
            canGo = false;
            break;
        }
    }
    if (canGo) {
        showStep(step);
    } else {
        for (let s = 0; s < step; s++) {
            if (!validateStep(s, true)) {
                showStep(s);
                return;
            }
        }
    }
}

function nextStep(step) {
    if (!validateStep(currentStep)) return;
    showStep(step);
}

function prevStep(step) {
    showStep(step);
}

// ============================================
// VALIDATION
// ============================================
function validateStep(step, silent = false) {
    let valid = true;

    if (step === 0) {
        const fioInput = document.getElementById('fio');
        const fio = fioInput.value.trim();
        if (!validateFullName(fio)) {
            if (!silent) {
                document.getElementById('fioError').classList.add('show');
                fioInput.classList.add('error');
            }
            valid = false;
        } else {
            document.getElementById('fioError').classList.remove('show');
            fioInput.classList.remove('error');
        }

        const obj = document.getElementById('objectSelect').value;
        if (!obj) {
            if (!silent) {
                document.getElementById('objectError').classList.add('show');
                document.getElementById('objectSelect').classList.add('error');
            }
            valid = false;
        } else {
            document.getElementById('objectError').classList.remove('show');
            document.getElementById('objectSelect').classList.remove('error');
        }
    }

    if (step === 1) {
        const work = document.getElementById('workType').value;
        if (!work) {
            if (!silent) {
                document.getElementById('workError').classList.add('show');
                document.getElementById('workType').classList.add('error');
            }
            valid = false;
        } else {
            document.getElementById('workError').classList.remove('show');
            document.getElementById('workType').classList.remove('error');
        }
    }

    if (step === 2) {
        const transports = document.querySelectorAll('.transport-card');
        if (transports.length === 0) {
            if (!silent) document.getElementById('transportsError').classList.add('show');
            valid = false;
        } else {
            document.getElementById('transportsError').classList.remove('show');
            let allValid = true;
            transports.forEach(t => {
                const type = t.querySelector('.transport-type').value;
                const gos = getGosNumber(t);
                const hours = parseFloat(t.querySelector('.transport-hours').value);
                if (!type || !/^\d{3,4}$/.test(gos) || isNaN(hours) || hours <= 0) {
                    allValid = false;
                    if (!silent) t.style.borderColor = '#e74c3c';
                } else {
                    t.style.borderColor = '#e8e8e8';
                }
            });
            if (!allValid) {
                if (!silent) {
                    document.getElementById('transportsError').textContent = '❌ Заполните все поля у транспорта';
                    document.getElementById('transportsError').classList.add('show');
                }
                valid = false;
            }
        }
    }

    if (step === 3) {
        const mCount = parseInt(document.getElementById('mountersCount').value) || 0;
        const mHours = parseFloat(document.getElementById('mountersHours').value);
        const wCount = parseInt(document.getElementById('weldersCount').value) || 0;
        const wHours = parseFloat(document.getElementById('weldersHours').value);
        const wSurnamesInput = document.getElementById('weldersSurnames');
        const wSurnames = wSurnamesInput.value.trim();

        let hasWorkers = false;
        let allValid = true;

        // Монтажники
        if (mCount > 0 || (mHours && mHours > 0)) {
            hasWorkers = true;
            if (mCount <= 0 || isNaN(mHours) || mHours <= 0) {
                if (!silent) {
                    document.getElementById('mountersError').classList.add('show');
                    document.getElementById('mountersCount').classList.add('error');
                    document.getElementById('mountersHours').classList.add('error');
                }
                allValid = false;
            } else {
                document.getElementById('mountersError').classList.remove('show');
                document.getElementById('mountersCount').classList.remove('error');
                document.getElementById('mountersHours').classList.remove('error');
            }
        }

        // Сварщики
        if (wCount > 0 || (wHours && wHours > 0) || wSurnames) {
            hasWorkers = true;
            const surnamesList = extractSurnames(wSurnames);
            
            if (wCount <= 0 || isNaN(wHours) || wHours <= 0 || surnamesList.length < wCount) {
                if (!silent) {
                    document.getElementById('weldersError').classList.add('show');
                    document.getElementById('weldersCount').classList.add('error');
                    document.getElementById('weldersHours').classList.add('error');
                    wSurnamesInput.classList.add('error');
                }
                allValid = false;
            } else {
                document.getElementById('weldersError').classList.remove('show');
                document.getElementById('weldersCount').classList.remove('error');
                document.getElementById('weldersHours').classList.remove('error');
                wSurnamesInput.classList.remove('error');
            }
        }

        if (!hasWorkers) {
            if (!silent) document.getElementById('workersError').classList.add('show');
            allValid = false;
        } else {
            document.getElementById('workersError').classList.remove('show');
        }

        if (!allValid) valid = false;
    }

    return valid;
}

// ============================================
// TRANSPORT MANAGEMENT
// ============================================
function getGosNumber(transportCard) {
    let value = '';
    const digits = transportCard.querySelectorAll('.digit-input');
    digits.forEach(d => {
        const val = d.value.trim();
        if (val) value += val;
    });
    return value;
}

let transportCounter = 0;

function addTransport(type = '', gosDigits = ['', '', '', ''], hours = '') {
    transportCounter++;
    const container = document.getElementById('transportsContainer');
    const div = document.createElement('div');
    div.className = 'transport-card';
    div.dataset.id = transportCounter;
    div.innerHTML = `
        <div class="transport-header">
            <h4>🚗 Транспорт #${transportCounter}</h4>
            <button class="remove-transport" onclick="removeTransport(this)" title="Удалить">×</button>
        </div>
        <div class="transport-row">
            <div>
                <label>Тип транспорта <span class="required">*</span></label>
                <select class="transport-type">
                    <option value="">-- Выберите --</option>
                    <option value="Квадроцикл" ${type === 'Квадроцикл' ? 'selected' : ''}>Квадроцикл</option>
                    <option value="Трактор" ${type === 'Трактор' ? 'selected' : ''}>Трактор</option>
                    <option value="Машина" ${type === 'Машина' ? 'selected' : ''}>Машина</option>
                    <option value="Погрузчик" ${type === 'Погрузчик' ? 'selected' : ''}>Погрузчик</option>
                    <option value="Экскаватор" ${type === 'Экскаватор' ? 'selected' : ''}>Экскаватор</option>
                    <option value="Бульдозер" ${type === 'Бульдозер' ? 'selected' : ''}>Бульдозер</option>
                    <option value="Кран" ${type === 'Кран' ? 'selected' : ''}>Кран</option>
                    <option value="Другое" ${type === 'Другое' ? 'selected' : ''}>Другое</option>
                </select>
            </div>
            <div>
                <label>Госномер <span class="required">*</span></label>
                <div class="digits-container">
                    ${[0,1,2,3].map(i => `
                        <input type="text" class="digit-input" maxlength="1" autocomplete="off" value="${gosDigits[i] || ''}">
                    `).join('')}
                </div>
                <div style="font-size:12px; color:#888; margin-top:2px;">3 или 4 цифры</div>
            </div>
            <div>
                <label>Часы работы <span class="required">*</span></label>
                <input type="number" class="transport-hours" placeholder="8" min="0" step="0.5" value="${hours}">
            </div>
        </div>
    `;
    container.appendChild(div);

    setupDigitInputs(div);

    div.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', () => {
            document.getElementById('transportsError').classList.remove('show');
        });
        el.addEventListener('input', () => {
            document.getElementById('transportsError').classList.remove('show');
        });
    });
}

function setupDigitInputs(container) {
    const digits = container.querySelectorAll('.digit-input');
    digits.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '').slice(0, 1);
            this.classList.toggle('filled', !!this.value);
            document.getElementById('transportsError').classList.remove('show');
            this.classList.remove('error');
            if (this.value && index < 3) {
                digits[index + 1].focus();
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace') {
                if (this.value === '' && index > 0) {
                    digits[index - 1].focus();
                    digits[index - 1].value = '';
                    digits[index - 1].classList.remove('filled');
                } else if (this.value !== '') {
                    this.value = '';
                    this.classList.remove('filled');
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowLeft' && index > 0) {
                digits[index - 1].focus();
                e.preventDefault();
            }
            if (e.key === 'ArrowRight' && index < 3) {
                digits[index + 1].focus();
                e.preventDefault();
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pasted.replace(/\D/g, '').slice(0, 4);
            for (let i = 0; i < 4 && i < digitsOnly.length; i++) {
                digits[i].value = digitsOnly[i] || '';
                digits[i].classList.toggle('filled', !!digitsOnly[i]);
            }
            document.getElementById('transportsError').classList.remove('show');
            digits.forEach(d => d.classList.remove('error'));
        });
    });
}

function removeTransport(btn) {
    const card = btn.closest('.transport-card');
    if (document.querySelectorAll('.transport-card').length > 1) {
        card.remove();
    } else {
        alert('Нельзя удалить последний транспорт. Добавьте новый или оставьте хотя бы один.');
    }
    document.getElementById('transportsError').classList.remove('show');
}

// ============================================
// BUILD REVIEW
// ============================================
function buildReview() {
    const fioInput = document.getElementById('fio');
    formatFullName(fioInput);
    
    const fio = fioInput.value.trim();
    const object = document.getElementById('objectSelect').value;
    const workType = document.getElementById('workType').value;

    const transports = [];
    document.querySelectorAll('.transport-card').forEach(t => {
        const type = t.querySelector('.transport-type').value;
        const gos = getGosNumber(t);
        const hours = t.querySelector('.transport-hours').value;
        transports.push({ type, gosNumber: gos, hours });
    });

    const mCount = parseInt(document.getElementById('mountersCount').value) || 0;
    const mHours = parseFloat(document.getElementById('mountersHours').value) || 0;
    const wCount = parseInt(document.getElementById('weldersCount').value) || 0;
    const wHours = parseFloat(document.getElementById('weldersHours').value) || 0;
    
    const wSurnamesInput = document.getElementById('weldersSurnames');
    const surnamesList = extractSurnames(wSurnamesInput.value);
    // Форматируем для отображения через запятую
    const formattedSurnames = surnamesList.join(', ');

    const report = {
        fio,
        object,
        workType,
        transports,
        personnel: {
            mounters: { count: mCount, hours: mHours },
            welders: { count: wCount, hours: wHours, surnames: formattedSurnames }
        }
    };

    return report;
}

function showReview() {
    let allValid = true;
    for (let s = 0; s < 4; s++) {
        if (!validateStep(s, true)) {
            allValid = false;
            break;
        }
    }

    if (!allValid) {
        alert('⚠️ Заполните все обязательные поля перед проверкой отчета.');
        for (let s = 0; s < 4; s++) {
            if (!validateStep(s, true)) {
                showStep(s);
                return;
            }
        }
        return;
    }

    const data = buildReview();
    const body = document.getElementById('reviewBody');

    let transportsHtml = data.transports.map(t => 
        `<div class="review-sub-item">• ${t.type}: госномер ${t.gosNumber} — ${t.hours} ч.</div>`
    ).join('') || '<div class="review-sub-item">—</div>';

    let workersHtml = '';
    if (data.personnel.mounters.count > 0) {
        workersHtml += `<div class="review-sub-item">🔧 Монтажники: ${data.personnel.mounters.count} чел. — ${data.personnel.mounters.hours} ч.</div>`;
    }
    if (data.personnel.welders.count > 0) {
        workersHtml += `<div class="review-sub-item">🔥 Сварщики: ${data.personnel.welders.count} чел. — ${data.personnel.welders.hours} ч.</div>`;
        if (data.personnel.welders.surnames) {
            workersHtml += `<div class="review-sub-item" style="font-size:13px; color:#555; padding-left:12px;">Фамилии: ${data.personnel.welders.surnames}</div>`;
        }
    }

    body.innerHTML = `
        <div class="review-item">
            <span class="review-label">👤 ФИО</span>
            <span class="review-value">${data.fio || '—'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">🏗 Объект</span>
            <span class="review-value">${data.object || '—'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">🔧 Вид работ</span>
            <span class="review-value">${data.workType || '—'}</span>
        </div>
        <div class="review-item">
            <span class="review-label">🚗 Транспорт</span>
            <div class="review-sub">${transportsHtml}</div>
        </div>
        <div class="review-item">
            <span class="review-label">👷 Персонал</span>
            <div class="review-sub">${workersHtml || '<div class="review-sub-item">—</div>'}</div>
        </div>
    `;

    document.getElementById('reviewModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeReview() {
    document.getElementById('reviewModal').classList.remove('show');
    document.body.style.overflow = '';
}

// ============================================
// SUBMIT
// ============================================
function submitReport() {
    const data = buildReview();

    showResult(data);
    console.log('📊 ПОЛНЫЙ ОТЧЕТ:', data);

    closeReview();

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = '✅ Отправлено!';

    // Отправляем данные в Telegram-бота (работает внутри Telegram Mini App)
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            Telegram.WebApp.sendData(JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка отправки в Telegram:', e);
        }
    }

    setTimeout(() => {
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = '📤 Отправить';
        // Закрываем мини-приложение после отправки, чтобы бот показал результат в чате
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.close();
        }
    }, 1200);
}

// ============================================
// SHOW RESULT
// ============================================
function showResult(data) {
    const block = document.getElementById('resultBlock');
    const content = document.getElementById('resultContent');

    let transportsHtml = data.transports.map(t => 
        `<div class="transport-item">• ${t.type}: госномер ${t.gosNumber} — ${t.hours} ч.</div>`
    ).join('');

    let workersHtml = '';
    if (data.personnel.mounters.count > 0) {
        workersHtml += `<div class="worker-item">🔧 Монтажники: ${data.personnel.mounters.count} чел. — ${data.personnel.mounters.hours} ч.</div>`;
    }
    if (data.personnel.welders.count > 0) {
        workersHtml += `<div class="worker-item">🔥 Сварщики: ${data.personnel.welders.count} чел. — ${data.personnel.welders.hours} ч.</div>`;
        if (data.personnel.welders.surnames) {
            workersHtml += `<div class="worker-item" style="font-size:12px; color:#555; padding-left:12px;">Фамилии: ${data.personnel.welders.surnames}</div>`;
        }
    }

    content.innerHTML = `
        <div class="result-item"><span class="label">👤 ФИО:</span> <span class="value">${data.fio}</span></div>
        <div class="result-item"><span class="label">🏗 Объект:</span> <span class="value">${data.object}</span></div>
        <div class="result-item"><span class="label">🔧 Вид работ:</span> <span class="value">${data.workType}</span></div>
        <div class="result-item">
            <span class="label">🚗 Транспорт:</span>
            <div class="result-transports">${transportsHtml}</div>
        </div>
        <div class="result-item">
            <span class="label">👷 Персонал:</span>
            <div class="result-workers">${workersHtml}</div>
        </div>
        <div class="result-item" style="border-bottom: none; margin-top:6px; font-size:12px; color:#888;">
            🕐 Отправлено: ${new Date().toLocaleString('ru-RU')}
        </div>
    `;

    block.classList.add('show');
    document.getElementById('successMessage').classList.add('show');

    setTimeout(() => {
        block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('addTransportBtn').addEventListener('click', function() {
    addTransport();
    setTimeout(() => {
        const last = document.querySelector('.transport-card:last-child');
        if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
});

document.getElementById('reviewBtn').addEventListener('click', showReview);

document.getElementById('confirmSubmitBtn').addEventListener('click', submitReport);

document.getElementById('submitBtn').addEventListener('click', function() {
    showReview();
});

document.getElementById('reviewModal').addEventListener('click', function(e) {
    if (e.target === this) closeReview();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeReview();
});

// Автоформатирование при потере фокуса
document.getElementById('fio').addEventListener('blur', function() {
    formatFullName(this);
});

document.getElementById('weldersSurnames').addEventListener('blur', function() {
    // Извлекаем фамилии и форматируем
    const surnames = extractSurnames(this.value);
    this.value = surnames.join(', ');
});

// ============================================
// INIT
// ============================================
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

addTransport();

setTimeout(() => {
    document.getElementById('fio').focus();
}, 500);

console.log('✅ Форма с автоматическим извлечением фамилий загружена!');
