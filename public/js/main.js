document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.alert-dismissible').forEach(function (alert) {
    setTimeout(function () {
      var bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 4000);
  });

  document.querySelectorAll('input[type="number"]').forEach(function (input) {
    input.addEventListener('change', function () { if (parseInt(this.value, 10) < 1) this.value = 1; });
    input.addEventListener('input', function () { if (parseInt(this.value, 10) < 1) this.value = 1; });
  });

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); this.closest('form').submit(); }
    });
  }
});
