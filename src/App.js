import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Bar } from 'react-chartjs-2';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [obitos, setObitos] = useState([]);
  const [obitos15, setObitos15] = useState([]);
  // const [data, setData] = useState([]);

  const dateFormatted = useCallback(
    (date) => format(date, "dd'/'MM", { locale: pt }),
    []
  );

  useEffect(() => {
    (async function loadObitos() {
      const obitosUrl = axios.create({
        baseURL:
          'https://services1.arcgis.com/OlP4dGNtIcnD3RYf/arcgis/rest/services/Data_casos_6/FeatureServer/0/query?f=json&where=Classi%3D%27Obitos%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Data%20asc&resultOffset=0&resultRecordCount=32000&resultType=standard&cacheHint=true',
      });

      const obitosJson = await obitosUrl.get();
      const response = JSON.parse(obitosJson.request.response);

      const starDate = new Date('03-06-2020');

      const geral = await response.features.map((item, index) => {
        const perDay =
          index === 0
            ? item.attributes.Soma_por_dia
            : item.attributes.Soma_por_dia -
              response.features[index - 1].attributes.Soma_por_dia;

        return {
          date: addDays(starDate, Number(item.attributes.Data)),
          perDay,
          ...item.attributes,
        };
      });

      const ultimos15dias = geral.slice(Math.max(geral.length - 15, 1));

      setObitos(geral);
      setObitos15(ultimos15dias);
      setLoading(false);
    })();
  }, []);

  const data = useMemo(() => {
    return {
      datasets: [
        {
          label: 'Óbitos por dia',
          type: 'line',
          data: [...obitos.map((item) => item.perDay)],
          fill: false,
          borderColor: '#ff3300',
          backgroundColor: '#ff3300',
          pointBorderColor: '#ff3300',
          pointBackgroundColor: '#ff3300',
          pointHoverBackgroundColor: '#ff3300',
          pointHoverBorderColor: '#ff3300',
          yAxisID: 'y-axis-2',
        },
        {
          type: 'bar',
          label: 'Total de mortes',
          data: [...obitos.map((item) => item.Soma_por_dia)],
          fill: false,
          backgroundColor: '#cccccc',
          borderColor: '#cccccc',
          hoverBackgroundColor: '#cccccc',
          hoverBorderColor: '#cccccc',
          yAxisID: 'y-axis-1',
        },
      ],
    };
  }, [obitos]);

  const data15 = useMemo(() => {
    return {
      datasets: [
        {
          label: 'Óbitos por dia',
          type: 'line',
          data: [...obitos15.map((item) => item.perDay)],
          fill: false,
          borderColor: '#ff3300',
          backgroundColor: '#ff3300',
          pointBorderColor: '#ff3300',
          pointBackgroundColor: '#ff3300',
          pointHoverBackgroundColor: '#ff3300',
          pointHoverBorderColor: '#ff3300',
          yAxisID: 'y-axis-2',
        },
        {
          type: 'bar',
          label: 'Total de mortes',
          data: [...obitos15.map((item) => item.Soma_por_dia)],
          fill: false,
          backgroundColor: '#cccccc',
          borderColor: '#cccccc',
          hoverBackgroundColor: '#cccccc',
          hoverBorderColor: '#cccccc',
          yAxisID: 'y-axis-1',
        },
      ],
    };
  }, [obitos15]);

  const options = {
    responsive: true,
    tooltips: {
      mode: 'label',
    },
    elements: {
      line: {
        fill: false,
      },
    },
    scales: {
      xAxes: [
        {
          display: true,
          gridLines: {
            display: false,
          },
          labels: [...obitos.map((item) => dateFormatted(item.date))],
        },
      ],
      yAxes: [
        {
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-1',
          gridLines: {
            display: true,
          },
          labels: {
            show: true,
          },
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-2',
          gridLines: {
            display: false,
          },
          labels: {
            show: true,
          },
        },
      ],
    },
  };

  const options15 = {
    responsive: true,
    tooltips: {
      mode: 'label',
    },
    elements: {
      line: {
        fill: false,
      },
    },
    scales: {
      xAxes: [
        {
          display: true,
          gridLines: {
            display: false,
          },
          labels: [...obitos15.map((item) => dateFormatted(item.date))],
        },
      ],
      yAxes: [
        {
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-1',
          gridLines: {
            display: true,
          },
          labels: {
            show: true,
          },
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-2',
          gridLines: {
            display: false,
          },
          labels: {
            show: true,
          },
        },
      ],
    },
  };

  const plugins = [
    {
      afterDraw: (chartInstance, easing) => {
        const { ctx } = chartInstance.chart;
        ctx.fillText('Dados via data.rio', 100, 100);
      },
    },
  ];

  return (
    <div>
      {loading ? (
        'Carregando...'
      ) : (
        <>
          <h1>Óbitos últimos 15 dias por Covid-19 cidade Rio de Janeiro</h1>
          <Bar data={data15} options={options15} plugins={plugins} />
          <h1>Óbitos por Covid-19 cidade Rio de Janeiro</h1>
          <Bar data={data} options={options} plugins={plugins} />
        </>
      )}
    </div>
  );
}
