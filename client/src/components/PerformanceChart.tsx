import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  data: Array<{ timestamp: Date; equity: number }>;
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  const chartData = {
    labels: data.map(point => new Date(point.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: "Cumulative P&L",
        data: data.map(point => point.equity - 10000), // Show P&L relative to starting equity
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#E0E0E0",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#E0E0E0",
        bodyColor: "#E0E0E0",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `P&L: ${value >= 0 ? '+' : ''}$${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "#374151",
        },
      },
      y: {
        ticks: {
          color: "#9CA3AF",
          callback: function(value) {
            return `$${value}`;
          },
        },
        grid: {
          color: "#374151",
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <p>No performance data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 relative">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
