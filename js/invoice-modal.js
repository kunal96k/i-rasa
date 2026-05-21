/**
 * Invoice Modal Handler
 * Handles viewing and downloading invoices from the modal
 */

class InvoiceModal {
    constructor() {
        this.currentOrderId = null;
        this.currentInvoice = null;
        this.init();
    }

    /**
     * Initialize invoice modal
     */
    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }

    /**
     * Create invoice modal HTML
     */
    createModalHTML() {
        if (document.getElementById('invoiceModal')) {
            return;
        }

        const modalHTML = `
        <div class="modal fade" id="invoiceModal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div class="modal-content" style="background: #0a0a0a; border: 2px solid #d4af37; color: #fff;">
                    <div class="modal-header" style="border-bottom: 1px solid #333; padding: 20px;">
                        <h5 class="modal-title" style="color: #d4af37; font-family: 'Cinzel', serif; font-weight: bold; letter-spacing: 1px;">
                            💵 Invoice Preview
                        </h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="color: #fff;">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                        <div id="invoiceContent" style="color: #e8dfc8;">
                            <div class="text-center">
                                <div class="spinner-border" role="status" style="color: #d4af37;">
                                    <span class="sr-only">Loading...</span>
                                </div>
                                <p style="margin-top: 10px; color: #aaa;">Loading invoice details...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #333; padding: 15px 20px;">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal" 
                            style="background: #333; border: 1px solid #555; color: #fff;">
                            Close
                        </button>
                        <button type="button" class="btn btn-info" id="previewInvoiceBtn"
                            style="background: #0284c7; border: 1px solid #0284c7; color: #fff; font-weight: bold; margin-right: 8px;">
                            👁 View PDF
                        </button>
                        <button type="button" class="btn btn-primary" id="downloadInvoiceBtn"
                            style="background: #d4af37; border: 1px solid #d4af37; color: #000; font-weight: bold;">
                            📥 Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Attach event listeners to modal buttons
     */
    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target;

            if (target.id === 'downloadInvoiceBtn' && this.currentOrderId) {
                this.downloadPDF(this.currentOrderId);
                return;
            }

            if (target.id === 'previewInvoiceBtn' && this.currentOrderId) {
                this.previewPDF(this.currentOrderId);
                return;
            }

            const invoiceButton = target.closest('[data-action="view-invoice"]');
            if (invoiceButton) {
                const orderId = invoiceButton.dataset.orderId;
                this.openModal(orderId);
            }
        });
    }

    /**
     * Open invoice modal and load data
     */
    async openModal(orderId) {
        this.currentOrderId = orderId;

        const modal = document.getElementById('invoiceModal');
        if (window.$ && window.$.fn.modal) {
            window.$('#invoiceModal').modal('show');
        } else if (modal && modal.classList) {
            modal.classList.add('show');
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }

        await this.loadInvoiceData(orderId);
    }

    /**
     * Load invoice data from API
     */
    async loadInvoiceData(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/invoice`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.currentInvoice = data.data;
                this.renderInvoiceContent(this.currentInvoice);
            } else {
                this.showError(data.message || 'Failed to load invoice');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            this.showError('Failed to load invoice. Please try again.');
        }
    }

    /**
     * Render invoice content in modal
     */
    renderInvoiceContent(invoice) {
        const invoiceContent = document.getElementById('invoiceContent');
        const currencySymbol = invoice.currencySymbol || '$';
        const currencyLabel = invoice.currencyLabel || 'USD';
        const billingAddress = this.formatAddress(invoice.billingAddress);
        const shippingAddress = this.formatAddress(invoice.shippingAddress);

        let itemsHTML = '';
        if (invoice.items && invoice.items.length > 0) {
            itemsHTML = invoice.items.map(item => {
                const quantity = item.quantity || item.qty || 1;
                const unitPrice = item.price || 0;
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333;">${item.name || item.productName || 'Item'}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #333;">${quantity}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #333;">${currencySymbol}${this.formatPrice(unitPrice)}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #333;">${currencySymbol}${this.formatPrice(quantity * unitPrice)}</td>
                    </tr>
                `;
            }).join('');
        }

        const statusColor = this.getStatusColor(invoice.status);

        const content = `
            <style>
                .invoice-modal-header { display: flex; justify-content: space-between; flex-wrap: wrap; align-items: flex-start; gap: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #d4af37; }
                .invoice-logo { font-family: 'Samarkan', Georgia, serif; font-size: 38px; color: #d4af37; margin: 0; letter-spacing: 3px; }
                .invoice-subtitle { color: #aaa; font-size: 12px; margin: 4px 0 0; }
                .invoice-meta { text-align: right; font-size: 13px; color: #e8dfc8; }
                .invoice-meta div { margin-bottom: 6px; }
                .invoice-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin: 20px 0; }
                .detail-box { background: #0d0d0d; border: 1px solid #333; border-radius: 10px; padding: 18px; }
                .detail-label { color: #d4af37; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: block; }
                .detail-value { color: #e8dfc8; font-size: 14px; line-height: 1.6; }
                .items-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
                .items-table thead { background: #0d0d0d; }
                .items-table th { color: #d4af37; padding: 12px; text-align: left; font-weight: 700; font-size: 12px; text-transform: uppercase; }
                .items-table td { color: #e8dfc8; padding: 12px; }
                .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; font-size: 14px; color: #e8dfc8; }
                .summary-row.total { font-weight: 800; font-size: 15px; color: #d4af37; border-top: 2px solid #d4af37; margin-top: 12px; padding-top: 14px; }
                .status-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                .invoice-footer { background: #0d0d0d; border: 1px solid #333; border-radius: 10px; padding: 16px; color: #bbb; font-size: 13px; }
            </style>

            <div class="invoice-modal-header">
                <div>
                    <h3 class="invoice-logo">i rasa</h3>
                    <p class="invoice-subtitle">Premium invoice • ${currencyLabel} • ${currencySymbol.trim()}</p>
                </div>
                <div class="invoice-meta">
                    <div><strong>Invoice #</strong> #${invoice.orderId}</div>
                    <div><strong>Date</strong> ${this.formatDate(invoice.createdAt)}</div>
                    <div><strong>Status</strong> <span class="status-badge" style="background: ${statusColor}; color: ${statusColor === '#d4af37' ? '#000' : '#fff'};">${invoice.status || 'N/A'}</span></div>
                </div>
            </div>

            <div class="invoice-details">
                <div class="detail-box">
                    <span class="detail-label">Bill To</span>
                    <span class="detail-value">${invoice.customer || 'Customer name'}</span>
                    <span class="detail-value" style="margin-top: 8px; color: #999;">${invoice.email || 'email@example.com'}</span>
                    <span class="detail-value" style="margin-top: 4px; color: #999;">${invoice.customerPhone || ''}</span>
                    <span class="detail-label" style="margin-top: 16px;">Billing Address</span>
                    <span class="detail-value">${billingAddress || 'N/A'}</span>
                </div>
                <div class="detail-box">
                    <span class="detail-label">Shipping Address</span>
                    <span class="detail-value">${shippingAddress || 'N/A'}</span>
                    <span class="detail-label" style="margin-top: 16px;">Expected Delivery</span>
                    <span class="detail-value">${invoice.expectedDeliveryDate ? this.formatDate(invoice.expectedDeliveryDate) : 'Processing'}</span>
                    <span class="detail-label" style="margin-top: 16px;">Payment Method</span>
                    <span class="detail-value">${invoice.paymentMethod || 'N/A'}</span>
                </div>
            </div>

            <h4 style="color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px;">Order Items</h4>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML || '<tr><td colspan="4" style="text-align: center; color: #999; padding: 20px;">No items found</td></tr>'}
                </tbody>
            </table>

            <div style="background: #0d0d0d; border: 1px solid #333; border-radius: 8px; padding: 18px; margin: 20px 0;">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${currencySymbol}${this.formatPrice(invoice.subtotal)}</span>
                </div>
                ${invoice.discount > 0 ? `
                <div class="summary-row">
                    <span>Discount</span>
                    <span style="color: #4caf50;">-${currencySymbol}${this.formatPrice(invoice.discount)}</span>
                </div>
                ` : ''}
                ${invoice.shipping > 0 ? `
                <div class="summary-row">
                    <span>Shipping</span>
                    <span>${currencySymbol}${this.formatPrice(invoice.shipping)}</span>
                </div>
                ` : ''}
                ${invoice.handlingCharge > 0 ? `
                <div class="summary-row">
                    <span>Handling</span>
                    <span>${currencySymbol}${this.formatPrice(invoice.handlingCharge)}</span>
                </div>
                ` : ''}
                ${invoice.platformFee > 0 ? `
                <div class="summary-row">
                    <span>Platform fee</span>
                    <span>${currencySymbol}${this.formatPrice(invoice.platformFee)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Total Payable</span>
                    <span>${currencySymbol}${this.formatPrice(invoice.total)}</span>
                </div>
            </div>

            <div class="invoice-footer">
                <div style="margin-bottom: 10px;"><strong>Transaction ID:</strong> ${invoice.transactionId || 'N/A'}</div>
                <div><strong>Note:</strong> This invoice is generated as a secure PDF and may be saved for your records.</div>
            </div>
        `;

        invoiceContent.innerHTML = content;
    }

    /**
     * Preview invoice PDF in a new tab
     */
    async previewPDF(orderId) {
        const previewBtn = document.getElementById('previewInvoiceBtn');
        previewBtn.disabled = true;
        previewBtn.textContent = '⏳ Opening...';

        try {
            const blob = await this.fetchInvoiceBlob(orderId);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error previewing PDF:', error);
            if (window.showToast) {
                window.showToast('❌ Failed to open invoice preview', 'error');
            } else {
                alert('Failed to open invoice preview. Please try again.');
            }
        } finally {
            previewBtn.disabled = false;
            previewBtn.textContent = '👁 View PDF';
        }
    }

    /**
     * Download invoice as PDF
     */
    async downloadPDF(orderId) {
        const downloadBtn = document.getElementById('downloadInvoiceBtn');
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Generating...';

        try {
            const blob = await this.fetchInvoiceBlob(orderId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice_${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            if (window.showToast) {
                window.showToast('✅ Invoice downloaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            if (window.showToast) {
                window.showToast('❌ Failed to download invoice', 'error');
            } else {
                alert('Failed to download invoice. Please try again.');
            }
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = '📥 Download PDF';
        }
    }

    /**
     * Fetch invoice PDF blob from the server
     */
    async fetchInvoiceBlob(orderId) {
        const response = await fetch(`/api/orders/${orderId}/invoice/download`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.blob();
    }

    /**
     * Show error message in modal
     */
    showError(message) {
        const invoiceContent = document.getElementById('invoiceContent');
        invoiceContent.innerHTML = `
            <div style="text-align: center; color: #f44336; padding: 40px 20px;">
                <h4>⚠️ Error</h4>
                <p>${message}</p>
                <button class="btn btn-sm" data-dismiss="modal" 
                    style="background: #d4af37; color: #000; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">
                    Close
                </button>
            </div>
        `;
    }

    /**
     * Format price with commas
     */
    formatPrice(price) {
        if (price === undefined || price === null) return '0.00';
        return parseFloat(price).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format address object or plain string
     */
    formatAddress(address) {
        if (!address) return '';
        if (typeof address === 'string') {
            return address;
        }

        const parts = [];
        if (address.firstName || address.lastName) {
            parts.push(`${address.firstName || ''} ${address.lastName || ''}`.trim());
        }
        if (address.address1) parts.push(address.address1);
        if (address.address2) parts.push(address.address2);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zip) parts.push(address.zip);
        if (address.country) parts.push(address.country);
        return parts.filter(Boolean).join(', ');
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'PENDING': '#ff9800',
            'PROCESSING': '#2196f3',
            'COMPLETED': '#4caf50',
            'CANCELLED': '#f44336',
            'CONFIRMED': '#d4af37',
            'SHIPPED': '#4caf50',
            'DELIVERED': '#4caf50'
        };
        return colors[(status || '').toUpperCase()] || '#999';
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        return `badge badge-${(status || '').toLowerCase()}`;
    }
}

// Initialize invoice modal when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    window.invoiceModal = new InvoiceModal();
});
