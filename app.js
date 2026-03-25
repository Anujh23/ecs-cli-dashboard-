class DashboardApp {
    constructor() {
        this.data = {
            combinedTarget: 90000000,
            products: {
                ecs: {
                    name: 'ECS',
                    disbursementTarget: 42500000,
                    collectionTarget: 41496322,
                    disbursed: 0,
                    collected: 0,
                    freshLeads: 0,
                    totalAmount: 0
                },
                cil: {
                    name: 'CIL',
                    disbursementTarget: 47500000,
                    collectionTarget: 54256582,
                    disbursed: 0,
                    collected: 0,
                    freshLeads: 0,
                    totalAmount: 0
                }
            }
        };
        this.animationDuration = 2000;
        this.isAnimating = false;

        this.loadFromStorage();
        this.initElements();
        this.bindEvents();
        this.setDate();

        this.updateDisplay();
        this.updateSummary();
    }

    // ─── Storage ───
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('ecs-cil-dashboard');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data.combinedTarget = parsed.combinedTarget ?? this.data.combinedTarget;
                ['ecs', 'cil'].forEach(key => {
                    if (parsed.products && parsed.products[key]) {
                        Object.assign(this.data.products[key], parsed.products[key]);
                    }
                });
            }
        } catch (e) { /* ignore */ }
    }

    saveToStorage() {
        try {
            localStorage.setItem('ecs-cil-dashboard', JSON.stringify(this.data));
        } catch (e) { /* ignore */ }
    }

    // ─── Init ───
    initElements() {
        // Combined
        this.el = {};
        this.el.combinedCurrent = document.getElementById('combined-current');
        this.el.combinedToGo = document.getElementById('combined-to-go');
        this.el.combinedProgress = document.getElementById('combined-progress');
        this.el.combinedPercentage = document.getElementById('combined-percentage');
        this.el.combinedTargetDisplay = document.getElementById('combined-target-display');
        this.el.combinedTargetEdit = document.getElementById('combined-target-edit');
        this.el.combinedTargetInput = document.getElementById('combined-target-input');

        // Summary
        this.el.totalFreshLeads = document.getElementById('total-fresh-leads');
        this.el.totalAmountSummary = document.getElementById('total-amount-summary');
        this.el.totalDisbursedSummary = document.getElementById('total-disbursed-summary');
        this.el.totalCollectedSummary = document.getElementById('total-collected-summary');

        // Product summary
        ['ecs', 'cil'].forEach(p => {
            this.el[`${p}FreshSummary`] = document.getElementById(`${p}-fresh-summary`);
            this.el[`${p}AmountSummary`] = document.getElementById(`${p}-amount-summary`);
            this.el[`${p}DisbursedSummary`] = document.getElementById(`${p}-disbursed-summary`);
            this.el[`${p}CollectedSummary`] = document.getElementById(`${p}-collected-summary`);
        });

        // Product cards
        ['ecs', 'cil'].forEach(p => {
            this.el[`${p}FreshLeads`] = document.getElementById(`${p}-fresh-leads`);
            this.el[`${p}TotalAmount`] = document.getElementById(`${p}-total-amount`);
            this.el[`${p}Disbursed`] = document.getElementById(`${p}-disbursed`);
            this.el[`${p}Collected`] = document.getElementById(`${p}-collected`);
            this.el[`${p}FreshInput`] = document.getElementById(`${p}-fresh-input`);
            this.el[`${p}AmountInput`] = document.getElementById(`${p}-amount-input`);
            this.el[`${p}DisbursementInput`] = document.getElementById(`${p}-disbursement-input`);
            this.el[`${p}CollectionInput`] = document.getElementById(`${p}-collection-input`);
            this.el[`${p}DisbursementProgress`] = document.getElementById(`${p}-disbursement-progress`);
            this.el[`${p}CollectionProgress`] = document.getElementById(`${p}-collection-progress`);
            this.el[`${p}DisbursementPercentage`] = document.getElementById(`${p}-disbursement-percentage`);
            this.el[`${p}CollectionPercentage`] = document.getElementById(`${p}-collection-percentage`);
            this.el[`${p}Status`] = document.getElementById(`${p}-status`);
            this.el[`${p}DisbursementTargetLabel`] = document.getElementById(`${p}-disbursement-target-label`);
            this.el[`${p}CollectionTargetLabel`] = document.getElementById(`${p}-collection-target-label`);
            this.el[`${p}DisbursementTargetEdit`] = document.getElementById(`${p}-disbursement-target-edit`);
            this.el[`${p}CollectionTargetEdit`] = document.getElementById(`${p}-collection-target-edit`);
            this.el[`${p}DisbursementTargetInput`] = document.getElementById(`${p}-disbursement-target-input`);
            this.el[`${p}CollectionTargetInput`] = document.getElementById(`${p}-collection-target-input`);
        });

        this.el.updateBtn = document.getElementById('update-btn');
        this.el.resetBtn = document.getElementById('reset-btn');
        this.el.productCards = {
            ecs: document.querySelector('[data-product="ecs"]'),
            cil: document.querySelector('[data-product="cil"]')
        };
        this.sampleBtns = document.querySelectorAll('.sample-btn');
    }

    bindEvents() {
        this.el.updateBtn.addEventListener('cilck', () => this.updateDashboard());
        this.el.resetBtn.addEventListener('cilck', () => this.resetDashboard());

        // Enter key on any input
        document.querySelectorAll('.input').forEach(input => {
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.updateDashboard();
            });

            // Numeric only for currency fields
            if (input.inputMode === 'numeric') {
                input.addEventListener('input', e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    e.target.classList.remove('input-error');
                });
            }

            input.addEventListener('focus', () => input.select());
        });

        // Sample buttons
        this.sampleBtns.forEach(btn => {
            btn.addEventListener('cilck', () => this.loadSampleData(btn));
        });

        // Edit target buttons
        document.querySelectorAll('.edit-target-btn').forEach(btn => {
            btn.addEventListener('cilck', () => this.showTargetEdit(btn.dataset.target));
        });

        // Combined target save/cancel
        document.getElementById('combined-target-save').addEventListener('cilck', () => this.saveCombinedTarget());
        document.getElementById('combined-target-cancel').addEventListener('cilck', () => this.hideCombinedTargetEdit());

        // Product target save/cancel
        document.querySelectorAll('.target-save-btn').forEach(btn => {
            btn.addEventListener('cilck', () => this.saveProductTarget(btn.dataset.target));
        });
        document.querySelectorAll('.target-cancel-btn').forEach(btn => {
            btn.addEventListener('cilck', () => this.hideProductTargetEdit(btn.dataset.target));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.updateDashboard();
            }
        });
    }

    setDate() {
        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
            });
        }
    }

    // ─── Target Editing ───
    showTargetEdit(target) {
        if (target === 'combined') {
            this.el.combinedTargetEdit.classList.remove('hidden');
            this.el.combinedTargetInput.value = this.data.combinedTarget;
            this.el.combinedTargetInput.focus();
        } else {
            const editRow = document.getElementById(`${target}-target-edit`);
            if (editRow) {
                editRow.classList.remove('hidden');
                const input = document.getElementById(`${target}-target-input`);
                const [product, type] = target.split('-');
                input.value = this.data.products[product][`${type}Target`];
                input.focus();
            }
        }
    }

    saveCombinedTarget() {
        const val = parseInt(this.el.combinedTargetInput.value);
        if (val > 0) {
            this.data.combinedTarget = val;
            this.el.combinedTargetDisplay.textContent = this.formatCurrency(val);
            this.hideCombinedTargetEdit();
            this.updateDisplay();
            this.saveToStorage();
            this.notify('Combined target updated', 'success');
        }
    }

    hideCombinedTargetEdit() {
        this.el.combinedTargetEdit.classList.add('hidden');
    }

    saveProductTarget(target) {
        const input = document.getElementById(`${target}-target-input`);
        const val = parseInt(input.value);
        if (val > 0) {
            const [product, type] = target.split('-');
            this.data.products[product][`${type}Target`] = val;
            const label = document.getElementById(`${target}-target-label`);
            label.textContent = `Target: ${this.formatCurrency(val)}`;
            this.hideProductTargetEdit(target);
            this.updateDisplay();
            this.saveToStorage();
            this.notify(`${product.toUpperCase()} ${type} target updated`, 'success');
        }
    }

    hideProductTargetEdit(target) {
        const editRow = document.getElementById(`${target}-target-edit`);
        if (editRow) editRow.classList.add('hidden');
    }

    // ─── Update Dashboard ───
    async updateDashboard() {
        if (this.isAnimating) return;

        const values = {};
        ['ecs', 'cil'].forEach(p => {
            values[p] = {
                disbursed: parseInt(this.el[`${p}DisbursementInput`].value) || 0,
                collected: parseInt(this.el[`${p}CollectionInput`].value) || 0,
                freshLeads: parseInt(this.el[`${p}FreshInput`].value) || 0,
                totalAmount: parseInt(this.el[`${p}AmountInput`].value) || 0
            };
        });

        // Validate
        const allPositive = ['ecs', 'cil'].every(p =>
            Object.values(values[p]).every(v => v >= 0)
        );
        if (!allPositive) {
            this.showInputErrors();
            return;
        }

        this.isAnimating = true;
        this.setLoading(true);

        const oldData = {};
        ['ecs', 'cil'].forEach(p => {
            oldData[p] = { ...this.data.products[p] };
        });

        // Update data
        ['ecs', 'cil'].forEach(p => {
            Object.assign(this.data.products[p], values[p]);
        });

        // Animate all values
        const animations = [];
        ['ecs', 'cil'].forEach(p => {
            animations.push(
                this.animateValue(this.el[`${p}Disbursed`], oldData[p].disbursed, values[p].disbursed),
                this.animateValue(this.el[`${p}Collected`], oldData[p].collected, values[p].collected),
                this.animateValue(this.el[`${p}FreshLeads`], oldData[p].freshLeads, values[p].freshLeads, false),
                this.animateValue(this.el[`${p}TotalAmount`], oldData[p].totalAmount, values[p].totalAmount)
            );
        });

        const oldCombined = oldData.ecs.disbursed + oldData.cil.disbursed;
        const newCombined = values.ecs.disbursed + values.cil.disbursed;
        animations.push(this.animateCombined(oldCombined, newCombined));

        await Promise.all(animations);

        this.updateProgressBars();
        this.updateStatus();
        this.updateTargetAchievement();
        this.updateSummary();
        this.setLoading(false);
        this.isAnimating = false;
        this.updateDisplay();
        this.saveToStorage();
    }

    animateValue(element, from, to, isCurrency = true) {
        return new Promise(resolve => {
            element.classList.add('updating');
            const start = performance.now();
            const duration = this.animationDuration;

            const step = (now) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - t, 4);
                const current = Math.floor(from + (to - from) * ease);

                element.textContent = isCurrency ? this.formatCurrency(current) : current;

                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    element.textContent = isCurrency ? this.formatCurrency(to) : to;
                    element.classList.remove('updating');
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }

    animateCombined(from, to) {
        return new Promise(resolve => {
            this.el.combinedCurrent.classList.add('updating');
            const start = performance.now();
            const duration = this.animationDuration;

            const step = (now) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - t, 4);
                const current = Math.floor(from + (to - from) * ease);

                this.el.combinedCurrent.textContent = this.formatCurrency(current);

                const pct = Math.min((current / this.data.combinedTarget) * 100, 100);
                this.el.combinedProgress.style.width = `${pct}%`;
                this.el.combinedPercentage.textContent = `${Math.round(pct)}%`;

                const remaining = Math.max(this.data.combinedTarget - current, 0);
                this.el.combinedToGo.textContent = this.formatCurrency(remaining);

                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.el.combinedCurrent.textContent = this.formatCurrency(to);
                    this.el.combinedCurrent.classList.remove('updating');
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }

    updateProgressBars() {
        ['ecs', 'cil'].forEach(p => {
            const d = this.data.products[p];
            const disbPct = Math.min((d.disbursed / d.disbursementTarget) * 100, 100);
            const collPct = Math.min((d.collected / d.collectionTarget) * 100, 100);

            setTimeout(() => {
                this.el[`${p}DisbursementProgress`].style.width = `${disbPct}%`;
                this.el[`${p}CollectionProgress`].style.width = `${collPct}%`;
                this.el[`${p}DisbursementPercentage`].textContent = `${Math.round(disbPct)}%`;
                this.el[`${p}CollectionPercentage`].textContent = `${Math.round(collPct)}%`;
            }, 100);
        });

        const combinedCurrent = this.data.products.ecs.disbursed + this.data.products.cil.disbursed;
        const combinedPct = Math.min((combinedCurrent / this.data.combinedTarget) * 100, 100);
        this.el.combinedProgress.style.width = `${combinedPct}%`;
        this.el.combinedPercentage.textContent = `${Math.round(combinedPct)}%`;
    }

    updateStatus() {
        ['ecs', 'cil'].forEach(p => {
            this.el[`${p}Status`].className = 'product-status';
            this.el[`${p}Status`].textContent = '';
        });

        const ecs = this.data.products.ecs;
        const cil = this.data.products.cil;

        if (ecs.disbursed === 0 && cil.disbursed === 0) return;

        const ecsScore = ((ecs.disbursed / ecs.disbursementTarget) + (ecs.collected / ecs.collectionTarget)) / 2 * 100;
        const cilScore = ((cil.disbursed / cil.disbursementTarget) + (cil.collected / cil.collectionTarget)) / 2 * 100;

        const ecsDone = ecs.disbursed >= ecs.disbursementTarget && ecs.collected >= ecs.collectionTarget;
        const cilDone = cil.disbursed >= cil.disbursementTarget && cil.collected >= cil.collectionTarget;

        if (ecsDone && cilDone) {
            if (ecsScore > cilScore) {
                this.setStatus('ecs', 'leading', 'Leading');
                this.setStatus('cil', '', 'Complete');
            } else if (cilScore > ecsScore) {
                this.setStatus('cil', 'leading', 'Leading');
                this.setStatus('ecs', '', 'Complete');
            } else {
                this.setStatus('ecs', '', 'Tied');
                this.setStatus('cil', '', 'Tied');
            }
        } else if (ecsDone) {
            this.setStatus('ecs', 'leading', 'Complete');
            this.setStatus('cil', 'trailing', 'In Progress');
        } else if (cilDone) {
            this.setStatus('cil', 'leading', 'Complete');
            this.setStatus('ecs', 'trailing', 'In Progress');
        } else if (ecsScore > cilScore) {
            this.setStatus('ecs', 'leading', 'Leading');
            this.setStatus('cil', 'trailing', 'Trailing');
        } else if (cilScore > ecsScore) {
            this.setStatus('cil', 'leading', 'Leading');
            this.setStatus('ecs', 'trailing', 'Trailing');
        } else {
            this.setStatus('ecs', '', 'Tied');
            this.setStatus('cil', '', 'Tied');
        }
    }

    setStatus(product, cls, text) {
        const el = this.el[`${product}Status`];
        el.className = `product-status${cls ? ' ' + cls : ''}`;
        el.textContent = text;
    }

    updateTargetAchievement() {
        ['ecs', 'cil'].forEach(p => {
            const d = this.data.products[p];
            const card = this.el.productCards[p];
            if (d.disbursed >= d.disbursementTarget && d.collected >= d.collectionTarget) {
                card.classList.add('target-achieved');
            } else {
                card.classList.remove('target-achieved');
            }
        });
    }

    updateSummary() {
        const ecs = this.data.products.ecs;
        const cil = this.data.products.cil;

        this.el.totalFreshLeads.textContent = ecs.freshLeads + cil.freshLeads;
        this.el.totalAmountSummary.textContent = this.formatCurrency(ecs.totalAmount + cil.totalAmount);
        this.el.totalDisbursedSummary.textContent = this.formatCurrency(ecs.disbursed + cil.disbursed);
        this.el.totalCollectedSummary.textContent = this.formatCurrency(ecs.collected + cil.collected);

        this.el.ecsFreshSummary.textContent = ecs.freshLeads;
        this.el.cilFreshSummary.textContent = cil.freshLeads;
        this.el.ecsAmountSummary.textContent = this.formatCurrency(ecs.totalAmount);
        this.el.cilAmountSummary.textContent = this.formatCurrency(cil.totalAmount);
        this.el.ecsDisbursedSummary.textContent = this.formatCurrency(ecs.disbursed);
        this.el.cilDisbursedSummary.textContent = this.formatCurrency(cil.disbursed);
        this.el.ecsCollectedSummary.textContent = this.formatCurrency(ecs.collected);
        this.el.cilCollectedSummary.textContent = this.formatCurrency(cil.collected);
    }

    updateDisplay() {
        ['ecs', 'cil'].forEach(p => {
            const d = this.data.products[p];
            this.el[`${p}Disbursed`].textContent = this.formatCurrency(d.disbursed);
            this.el[`${p}Collected`].textContent = this.formatCurrency(d.collected);
            this.el[`${p}FreshLeads`].textContent = d.freshLeads;
            this.el[`${p}TotalAmount`].textContent = this.formatCurrency(d.totalAmount);
            this.el[`${p}DisbursementTargetLabel`].textContent = `Target: ${this.formatCurrency(d.disbursementTarget)}`;
            this.el[`${p}CollectionTargetLabel`].textContent = `Target: ${this.formatCurrency(d.collectionTarget)}`;
        });

        const combinedCurrent = this.data.products.ecs.disbursed + this.data.products.cil.disbursed;
        this.el.combinedCurrent.textContent = this.formatCurrency(combinedCurrent);
        this.el.combinedTargetDisplay.textContent = this.formatCurrency(this.data.combinedTarget);

        const remaining = Math.max(this.data.combinedTarget - combinedCurrent, 0);
        this.el.combinedToGo.textContent = this.formatCurrency(remaining);

        this.updateProgressBars();
        this.updateStatus();
        this.updateTargetAchievement();
    }

    // ─── Reset ───
    resetDashboard() {
        if (this.isAnimating) return;

        ['ecs', 'cil'].forEach(p => {
            this.data.products[p].disbursed = 0;
            this.data.products[p].collected = 0;
            this.data.products[p].freshLeads = 0;
            this.data.products[p].totalAmount = 0;

            this.el[`${p}DisbursementInput`].value = '';
            this.el[`${p}CollectionInput`].value = '';
            this.el[`${p}FreshInput`].value = '';
            this.el[`${p}AmountInput`].value = '';
        });

        this.updateDisplay();
        this.updateSummary();
        this.saveToStorage();

        // Flash animation
        const elements = ['ecs', 'cil'].flatMap(p => [
            this.el[`${p}Disbursed`], this.el[`${p}Collected`],
            this.el[`${p}FreshLeads`], this.el[`${p}TotalAmount`]
        ]);
        elements.push(this.el.combinedCurrent);
        elements.forEach(el => {
            el.classList.add('updating');
            setTimeout(() => el.classList.remove('updating'), 300);
        });

        this.notify('Dashboard reset successfully', 'success');
    }

    // ─── Sample Data ───
    loadSampleData(btn) {
        ['ecs', 'cil'].forEach(p => {
            this.el[`${p}DisbursementInput`].value = btn.dataset[`${p}Disbursed`];
            this.el[`${p}CollectionInput`].value = btn.dataset[`${p}Collected`];
            this.el[`${p}FreshInput`].value = btn.dataset[`${p}Fresh`];
            this.el[`${p}AmountInput`].value = btn.dataset[`${p}Amount`];
        });

        btn.style.transform = 'scale(0.95)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
        setTimeout(() => this.updateDashboard(), 200);
    }

    // ─── Helpers ───
    showInputErrors() {
        document.querySelectorAll('.metric-input .input').forEach(input => {
            if (!input.value || parseInt(input.value) < 0) {
                input.classList.add('input-error');
                setTimeout(() => input.classList.remove('input-error'), 2000);
            }
        });
    }

    setLoading(on) {
        const btn = this.el.updateBtn;
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.spinner');
        btn.disabled = on;
        spinner.classList.toggle('hidden', !on);
        text.textContent = on ? 'Updating...' : 'Update Dashboard';
    }

    notify(message, type = 'success') {
        const el = document.createElement('div');
        el.className = `notification notification-${type}`;
        el.textContent = message;
        document.body.appendChild(el);

        setTimeout(() => el.classList.add('show'), 50);
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 300);
        }, 2500);
    }

    formatCurrency(num) {
        if (num === 0) return '\u20B90';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});
