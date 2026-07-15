// components/Charts.jsx — Reusable Chart.js wrappers for analytics.

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Register all Chart.js components once
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

// Shared chart options base
const baseOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: {
        color: "#B0B0B0",
        font: { family: "Inter", size: 12 },
        boxWidth: 12,
      },
    },
    tooltip: {
      backgroundColor: "#1E1E1E",
      titleColor: "#FFFFFF",
      bodyColor: "#B0B0B0",
      borderColor: "#2d2d2d",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      ticks: { color: "#B0B0B0", font: { family: "Inter", size: 11 } },
      grid:  { color: "rgba(255,255,255,0.05)" },
    },
    y: {
      ticks: { color: "#B0B0B0", font: { family: "Inter", size: 11 } },
      grid:  { color: "rgba(255,255,255,0.05)" },
    },
  },
};

/**
 * Bar chart — e.g. attendance % per student.
 */
export function BarChart({ labels, datasets, title }) {
  const data = { labels, datasets };
  const options = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: title
        ? { display: true, text: title, color: "#FFFFFF", font: { size: 14, family: "Inter", weight: "600" } }
        : undefined,
    },
  };
  return <Bar data={data} options={options} />;
}

/**
 * Pie chart — e.g. Good / Warning / Critical breakdown.
 */
export function PieChart({ labels, data, title }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(79, 70, 229, 0.8)",
        ],
        borderColor: "#121212",
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: baseOptions.plugins.legend,
      tooltip: baseOptions.plugins.tooltip,
      title: title
        ? { display: true, text: title, color: "#FFFFFF", font: { size: 14, family: "Inter", weight: "600" } }
        : undefined,
    },
  };

  return <Pie data={chartData} options={options} />;
}

/**
 * Line chart — e.g. attendance trend over time.
 */
export function LineChart({ labels, datasets, title }) {
  const data = { labels, datasets };
  const options = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      title: title
        ? { display: true, text: title, color: "#FFFFFF", font: { size: 14, family: "Inter", weight: "600" } }
        : undefined,
    },
    elements: {
      line:  { tension: 0.4 },
      point: { radius: 4, hoverRadius: 6 },
    },
  };
  return <Line data={data} options={options} />;
}
