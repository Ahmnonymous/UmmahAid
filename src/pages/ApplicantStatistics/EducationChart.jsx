import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

const EducationChart = ({ data }) => {
  const chartColors = getChartColorsArray('["--bs-warning", "--bs-primary", "--bs-success", "--bs-info", "--bs-danger", "--bs-secondary", "--bs-pink", "--bs-purple"]');

  // Sort data by value descending for better visualization
  const sortedData = [...data].sort((a, b) => (parseInt(b.value) || 0) - (parseInt(a.value) || 0)).slice(0, 8);
  
  const series = [{
    name: "Applicants",
    data: sortedData.map((item) => parseInt(item.value) || 0),
  }];

  const categories = sortedData.map((item) => item.label || "Unknown");

  const options = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "60%",
        distributed: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    colors: chartColors,
    dataLabels: {
      enabled: true,
      textAnchor: "start",
      formatter: function (val) {
        return val.toLocaleString();
      },
      offsetX: 5,
      style: {
        fontSize: "11px",
        fontWeight: 600,
        colors: ["#333"],
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        formatter: function (val) {
          return Math.round(val);
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toLocaleString() + " applicants";
        },
      },
    },
  };

  return series[0].data.length > 0 && series[0].data.some(v => v > 0) ? (
    <div id="education-chart">
      <ReactApexChart options={options} series={series} type="bar" height={260} className="apex-charts" />
    </div>
  ) : (
    <div className="text-center text-muted py-4">
      <i className="bx bx-bar-chart font-size-24 d-block mb-2 opacity-50"></i>
      <p className="mb-0">No data available</p>
    </div>
  );
};

export default EducationChart;

