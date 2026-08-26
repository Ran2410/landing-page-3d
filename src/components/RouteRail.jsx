export function RouteRail({ items, activeId, onSelect }) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId))

  return (
    <nav className="route" aria-label="Babak perjalanan kopi">
      <span className="route__track" aria-hidden="true" />
      <span
        className="route__fill"
        aria-hidden="true"
        style={{ height: `${(activeIndex / (items.length - 1)) * 100}%` }}
      />
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          className={`route__stop ${activeIndex === index ? 'is-active' : ''}`}
          onClick={() => onSelect(item.chapterId)}
          aria-current={activeIndex === index ? 'step' : undefined}
          aria-label={`Ke babak ${index + 1}: ${item.label}`}
        >
          <span className="route__dot" />
          <span className="route__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
