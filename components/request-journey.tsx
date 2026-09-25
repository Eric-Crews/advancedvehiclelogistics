const stages = ['Request', 'Review', 'Quote', 'Delivery'] as const;

const progress: Record<string, number> = {
  broker_review: 0,
  open: 1,
  quote_ready: 2,
  customer_interested: 2,
  paid: 3,
  booked: 3,
  in_transit: 3,
  delivered: 4,
};

export function RequestJourney({ status }: { status: string }) {
  const active = progress[status];
  if (active === undefined) return null;
  return <ol className="request-journey" aria-label="Delivery progress">
    {stages.map((stage, index) => <li key={stage} className={index < active ? 'complete' : index === active ? 'current' : ''} aria-current={index === active ? 'step' : undefined}>
      <span className="journey-dot" aria-hidden="true" />{stage}
    </li>)}
  </ol>;
}
