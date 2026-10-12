function StatCard({
  icon,
  color,
  title,
  value,
  change,
}) {
  return (
    <div className="real-stat-card">

      <div
        className={`real-stat-icon ${color}`}
      >
        {icon}
      </div>

      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {change}
        </small>

      </div>

    </div>
  );
}

export default StatCard;