export const SHOWCASE_TICKET_AMOUNT = 3000;

export function isValidShowcaseTicketPayment(intent, showcaseId, userId) {
    return typeof intent?.id === 'string'
        && /^pi_[A-Za-z0-9]+$/.test(intent.id)
        && intent.status === 'succeeded'
        && intent.currency === 'usd'
        && intent.amount === SHOWCASE_TICKET_AMOUNT
        && intent.amount_received === SHOWCASE_TICKET_AMOUNT
        && intent.metadata?.type === 'showcase_ticket'
        && Number(intent.metadata.showcase_id) === Number(showcaseId)
        && Number(intent.metadata.user_id) === Number(userId);
}
