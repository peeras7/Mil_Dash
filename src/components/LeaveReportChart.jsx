import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// This component now accepts a custom yAxisLabel
export default function LeaveReportChart({ data, title, yAxisLabel }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && data) {
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Approved Leave Days',
              data: data.values,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: title,
              font: { size: 16, weight: '600' },
              padding: { top: 10, bottom: 20 }
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: yAxisLabel || 'Value' // Use the custom label
              }
            },
            x: {
                grid: { display: false }
            }
          },
        },
      });
    }
  }, [data, title, yAxisLabel]);

  return <div className="h-96"><canvas ref={chartRef}></canvas></div>;
}