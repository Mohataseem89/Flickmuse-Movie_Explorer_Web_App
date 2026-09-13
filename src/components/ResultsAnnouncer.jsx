const ResultsAnnouncer = ({ loading, page, count, label = "results" }) => {
  const message = loading
    ? `Loading ${label}, page ${page}.`
    : count > 0
      ? `${count.toLocaleString()} ${label} loaded. Page ${page}.`
      : `No ${label} found. Page ${page}.`;

  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
};

export default ResultsAnnouncer;
