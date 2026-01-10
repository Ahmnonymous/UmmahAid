import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const NationalityChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-primary", "--bs-success", "--bs-warning", "--bs-danger", "--bs-info", "--bs-secondary", "--bs-pink", "--bs-purple"]');

  const series = data.map((item) => parseInt(item.value) || 0);
  const labels = data.map((item) => item.label || "Unknown");

  const options = {
    chart: {
      type: "pie",
      height: 260,
      toolbar: {
        show: false,
      },
    },
    labels: labels,
    colors: chartColors,
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return opts.w.config.series[opts.seriesIndex];
      },
      style: {
        fontSize: "11px",
        fontWeight: 600,
        colors: ["#fff"],
      },
      dropShadow: {
        enabled: true,
        color: "#000",
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.7,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "0%",
        },
        expandOnClick: false,
      },
    },
    tooltip: {
      enabled: false,
    },
  };

  return series.length > 0 && series.some(v => v > 0) ? (
    <div id="nationality-chart">
      <ReactApexChart options={options} series={series} type="pie" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-pie-chart-alt font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default NationalityChart;

