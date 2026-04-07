import Payment, { InitiateProps } from "./payment";
import { responses } from "../config/strings";
import {
    Constants,
    PaymentPlan,
    SiteInfo,
    UIConstants,
} from "@courselit/common-models";
import { getUnitAmount } from "./helpers";

const PAYPAL_API_BASE = {
    sandbox: "https://api-m.sandbox.paypal.com",
    live: "https://api-m.paypal.com",
};

export default class PaypalPayment implements Payment {
    public siteinfo: SiteInfo;
    public name: string;
    private clientId: string;
    private clientSecret: string;
    private webhookId: string;
    private baseUrl: string;

    constructor(siteinfo: SiteInfo) {
        this.siteinfo = siteinfo;
        this.name = UIConstants.PAYMENT_METHOD_PAYPAL;
    }

    async setup() {
        if (!this.siteinfo.currencyISOCode) {
            throw new Error(responses.currency_iso_not_set);
        }

        if (!this.siteinfo.paypalClientId || !this.siteinfo.paypalSecret) {
            throw new Error(
                `${this.name} ${responses.payment_invalid_settings}`,
            );
        }

        this.clientId = this.siteinfo.paypalClientId;
        this.clientSecret = this.siteinfo.paypalSecret;
        this.webhookId = this.siteinfo.paypalWebhookId || "";
        this.baseUrl = this.siteinfo.paypalSandbox
            ? PAYPAL_API_BASE.sandbox
            : PAYPAL_API_BASE.live;

        return this;
    }

    private async getAccessToken(): Promise<string> {
        const auth = Buffer.from(
            `${this.clientId}:${this.clientSecret}`,
        ).toString("base64");

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `PayPal auth error: ${error.error_description || error.error}`,
            );
        }

        const data = await response.json();
        return data.access_token;
    }

    private getHeaders(accessToken: string) {
        return {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        };
    }

    async initiate({ metadata, paymentPlan, product, origin }: InitiateProps) {
        const accessToken = await this.getAccessToken();
        const unitAmount = getUnitAmount(paymentPlan);
        const currency = this.siteinfo.currencyISOCode!.toUpperCase();

        if (
            paymentPlan.type === Constants.PaymentPlanType.SUBSCRIPTION ||
            paymentPlan.type === Constants.PaymentPlanType.EMI
        ) {
            return await this.initiateSubscription({
                accessToken,
                metadata,
                paymentPlan,
                product,
                origin,
                unitAmount,
                currency,
            });
        }

        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: metadata.invoiceId,
                    description: product.title,
                    custom_id: JSON.stringify(metadata),
                    amount: {
                        currency_code: currency,
                        value: unitAmount.toFixed(2),
                    },
                },
            ],
            payment_source: {
                paypal: {
                    experience_context: {
                        return_url: `${origin}/checkout/verify?id=${metadata.invoiceId}`,
                        cancel_url: `${origin}/checkout?type=${product.type}&id=${product.id}`,
                        brand_name: this.siteinfo.title || "Store",
                        user_action: "PAY_NOW",
                        payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                    },
                },
            },
        };

        const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
            method: "POST",
            headers: this.getHeaders(accessToken),
            body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `PayPal order error: ${error.details?.[0]?.description || error.message}`,
            );
        }

        const order = await response.json();
        const approvalLink = order.links.find(
            (link: any) => link.rel === "payer-action",
        );

        if (!approvalLink) {
            throw new Error("PayPal approval link not found");
        }

        return approvalLink.href;
    }

    private async initiateSubscription({
        accessToken,
        metadata,
        paymentPlan,
        product,
        origin,
        unitAmount,
        currency,
    }: {
        accessToken: string;
        metadata: any;
        paymentPlan: PaymentPlan;
        product: any;
        origin: string;
        unitAmount: number;
        currency: string;
    }) {
        const interval =
            paymentPlan.type === Constants.PaymentPlanType.EMI
                ? "MONTH"
                : paymentPlan.subscriptionYearlyAmount
                  ? "YEAR"
                  : "MONTH";

        const planPayload = {
            product_id: await this.ensureCatalogProduct(
                accessToken,
                product.title,
            ),
            name: `${product.title} - ${paymentPlan.name || "Subscription"}`,
            billing_cycles: [
                {
                    frequency: { interval_unit: interval, interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles:
                        paymentPlan.type === Constants.PaymentPlanType.EMI
                            ? paymentPlan.emiTotalInstallments || 0
                            : 0,
                    pricing_scheme: {
                        fixed_price: {
                            currency_code: currency,
                            value: unitAmount.toFixed(2),
                        },
                    },
                },
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                payment_failure_threshold: 3,
            },
        };

        const planResponse = await fetch(
            `${this.baseUrl}/v1/billing/plans`,
            {
                method: "POST",
                headers: this.getHeaders(accessToken),
                body: JSON.stringify(planPayload),
            },
        );

        if (!planResponse.ok) {
            const error = await planResponse.json();
            throw new Error(
                `PayPal plan error: ${error.details?.[0]?.description || error.message}`,
            );
        }

        const plan = await planResponse.json();

        const subscriptionPayload = {
            plan_id: plan.id,
            custom_id: JSON.stringify(metadata),
            application_context: {
                return_url: `${origin}/checkout/verify?id=${metadata.invoiceId}`,
                cancel_url: `${origin}/checkout?type=${product.type}&id=${product.id}`,
                brand_name: this.siteinfo.title || "Store",
                user_action: "SUBSCRIBE_NOW",
            },
        };

        const subResponse = await fetch(
            `${this.baseUrl}/v1/billing/subscriptions`,
            {
                method: "POST",
                headers: this.getHeaders(accessToken),
                body: JSON.stringify(subscriptionPayload),
            },
        );

        if (!subResponse.ok) {
            const error = await subResponse.json();
            throw new Error(
                `PayPal subscription error: ${error.details?.[0]?.description || error.message}`,
            );
        }

        const subscription = await subResponse.json();
        const approvalLink = subscription.links.find(
            (link: any) => link.rel === "approve",
        );

        if (!approvalLink) {
            throw new Error("PayPal approval link not found");
        }

        return approvalLink.href;
    }

    private async ensureCatalogProduct(
        accessToken: string,
        productName: string,
    ): Promise<string> {
        const response = await fetch(`${this.baseUrl}/v1/catalogs/products`, {
            method: "POST",
            headers: this.getHeaders(accessToken),
            body: JSON.stringify({
                name: productName,
                type: "DIGITAL",
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `PayPal product error: ${error.details?.[0]?.description || error.message}`,
            );
        }

        const product = await response.json();
        return product.id;
    }

    async getCurrencyISOCode() {
        return this.siteinfo.currencyISOCode!;
    }

    async verify(event: any) {
        if (!event || !event.event_type) {
            return false;
        }

        switch (event.event_type) {
            case "CHECKOUT.ORDER.APPROVED": {
                const orderId = event.resource?.id;
                if (orderId) {
                    await this.captureOrder(orderId);
                }
                return false;
            }
            case "PAYMENT.CAPTURE.COMPLETED":
                return event.resource?.status === "COMPLETED";
            case "BILLING.SUBSCRIPTION.ACTIVATED":
                return true;
            case "PAYMENT.SALE.COMPLETED":
                return true;
            default:
                return false;
        }
    }

    private async captureOrder(orderId: string) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(
            `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
            {
                method: "POST",
                headers: this.getHeaders(accessToken),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                `PayPal capture error: ${error.details?.[0]?.description || error.message}`,
            );
        }

        return await response.json();
    }

    getPaymentIdentifier(event: any) {
        if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
            return event.resource?.id;
        }
        if (event.event_type === "PAYMENT.SALE.COMPLETED") {
            return event.resource?.id;
        }
        return event.resource?.id;
    }

    getMetadata(event: any) {
        let customId: string | undefined;

        if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
            customId = event.resource?.custom_id;
        } else if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
            customId = event.resource?.custom_id;
        } else if (event.event_type === "PAYMENT.SALE.COMPLETED") {
            customId = event.resource?.custom;
        } else if (event.resource?.purchase_units?.[0]) {
            customId = event.resource.purchase_units[0].custom_id;
        }

        if (customId) {
            try {
                return JSON.parse(customId);
            } catch {
                return {};
            }
        }

        return {};
    }

    getName() {
        return this.name;
    }

    async cancel(subscriptionId: string) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(
            `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
            {
                method: "POST",
                headers: this.getHeaders(accessToken),
                body: JSON.stringify({ reason: "Cancelled by platform" }),
            },
        );

        if (!response.ok && response.status !== 204) {
            throw new Error("Failed to cancel PayPal subscription");
        }

        return true;
    }

    getSubscriptionId(event: any): string {
        if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
            return event.resource?.id;
        }
        if (event.resource?.billing_agreement_id) {
            return event.resource.billing_agreement_id;
        }
        return "";
    }

    async validateSubscription(subscriptionId: string) {
        const accessToken = await this.getAccessToken();
        const response = await fetch(
            `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
            { headers: this.getHeaders(accessToken) },
        );

        if (!response.ok) return false;

        const data = await response.json();
        return data.status === "ACTIVE";
    }
}
