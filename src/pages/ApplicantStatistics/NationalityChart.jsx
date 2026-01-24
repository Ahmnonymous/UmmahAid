import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const NationalityChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-primary", "--bs-success", "--bs-warning", "--bs-danger", "--bs-info", "--bs-secondary", "--bs-pink", "--bs-purple"]');

  const series = data.map((item) => parseInt(item.value) || 0);
  const labels = data.map((item) => item.label || "Unknown");

  const options = {
    chart: {
      type: "donut",
      height: 220,
      toolbar: {
        show: false,
      },
    },
    labels: labels,
    colors: chartColors,
    legend: {
      show: true,
      position: "right",
      fontSize: "12px",
      fontFamily: "inherit",
      offsetY: 0,
      height: 200,
      markers: {
        width: 10,
        height: 10,
        radius: 2,
      },
      itemMargin: {
        vertical: 4,
      },
      formatter: function (seriesName, opts) {
        return seriesName + ": " + opts.w.globals.series[opts.seriesIndex];
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Math.round(val) + "%";
      },
      style: {
        fontSize: "10px",
        fontWeight: 600,
        colors: ["#fff"],
      },
      dropShadow: {
        enabled: true,
        color: "#000",
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.5,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "55%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: "16px",
              fontWeight: 700,
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "12px",
              fontWeight: 600,
            },
          },
        },
        expandOnClick: false,
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val) {
          return val + " applicants";
        },
      },
    },
    responsive: [
      {
        breakpoint: 576,
        options: {
          legend: {
            position: "bottom",
            height: "auto",
          },
        },
      },
    ],
  };

  return series.length > 0 && series.some(v => v > 0) ? (
    <div id="nationality-chart">
      <ReactApexChart options={options} series={series} type="donut" height={220} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-doughnut-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default NationalityChart;

