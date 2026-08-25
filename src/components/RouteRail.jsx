export function RouteRail({ sections, activeIndex, onSelect }) {
  return (
    <nav className="route" aria-label="Babak perjalanan kopi">
      <span className="route__track" aria-hidden="true" />
      <span
        className="route__fill"
        aria-hidden="true"
        style={{ height: `${(activeIndex / (sections.length - 1)) * 100}%` }}
      />
      {sections.map((section, index) => (
        <button
          type="button"
          key={section.id}
          className={`route__stop ${activeIndex === index ? 'is-active' : ''}`}
          onClick={() => onSelect(index)}
          aria-current={activeIndex === index ? 'step' : undefined}
          aria-label={`Ke babak ${index + 1}: ${section.label}`}
        >
          <span className="route__dot" />
          <span className="route__label">{section.label}</span>
        </button>
      ))}
    </nav>
  )
}
