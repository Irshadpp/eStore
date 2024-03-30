(function ($) {
  "use strict";

  
  /*Sale statistics Chart*/
  if ($("#myChart").length) {
    var ctx = document.getElementById("myChart").getContext("2d");
    var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: "line",

      // The data for our dataset
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sales",
            tension: 0.3,
            fill: true,
            backgroundColor: "rgba(4, 209, 130, 0.2)",
            borderColor: "rgb(4, 209, 130)",
            data: data,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              usePointStyle: true,
            },
          },
        },
      },
    });
  } //End if
})(jQuery);
