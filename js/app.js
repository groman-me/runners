(function() {
  function handlePeriodLinkClick() {
    chart.update(this.attributes['data-period'].value );
  };

  function initUI() {
    d3.selectAll('.js-set-period').on('click', handlePeriodLinkClick)
  };

  d3.select(document).on('readystatechange', function() {
    if (document.readyState === "interactive") {
      initUI();
      window.chart = new Chart();
      var period = document.location.hash.replace('#', '');
      if (period !== 'month' && period !== 'week') { period = 'week' }
      window.chart.init(period);
    }
  });
})();
