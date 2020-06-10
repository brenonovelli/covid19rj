import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Bar } from 'react-chartjs-2';

import './App.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [obitos, setObitos] = useState([]);
  const [obitos15, setObitos15] = useState([]);

  const dateFormatted = useCallback(
    (date) => format(date, "dd'/'MM", { locale: pt }),
    []
  );

  useEffect(() => {
    (async function loadObitos() {
      const obitosUrl =
        'https://services1.arcgis.com/OlP4dGNtIcnD3RYf/arcgis/rest/services/Data_casos_6/FeatureServer/0/query?f=json&where=Classi%3D%27Obitos%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Data%20asc&resultOffset=0&resultRecordCount=32000&resultType=standard&cacheHint=true';

      const obitosJson = await axios.get(obitosUrl);

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

  const lineColor = '#ff1700';
  const barsColor = '#babeab';

  const dataParsed = useCallback((data) => {
    return {
      datasets: [
        {
          label: 'Óbitos por dia',
          type: 'line',
          data: [...data.map((item) => item.perDay)],
          fill: false,
          borderColor: lineColor,
          backgroundColor: lineColor,
          pointBorderColor: lineColor,
          pointBackgroundColor: lineColor,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: lineColor,
          yAxisID: 'y-axis-2',
        },
        {
          type: 'bar',
          label: 'Total de mortes',
          data: [...data.map((item) => item.Soma_por_dia)],
          fill: false,
          backgroundColor: barsColor,
          borderColor: barsColor,
          hoverBackgroundColor: barsColor,
          hoverBorderColor: barsColor,
          yAxisID: 'y-axis-1',
        },
      ],
    };
  }, []);

  const options = (dataOptions) => {
    return {
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
            labels: [...dataOptions.map((item) => dateFormatted(item.date))],
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
  };

  const plugins = [
    {
      afterDraw: (chartInstance) => {
        const { ctx } = chartInstance.chart;
        ctx.fillText('Dados via data.rio', 50, 50);
      },
    },
  ];

  return (
    <div>
      {loading ? (
        'Carregando...'
      ) : (
        <>
          <section>
            <header>
              <span>Óbitos por COVID-19 na cidade do Rio de Janeiro</span>
              <h1>Últimos 15 dias</h1>
            </header>
            <Bar
              data={dataParsed(obitos15)}
              options={options(obitos15)}
              plugins={plugins}
            />
          </section>
          <section>
            <header>
              <span>Óbitos por COVID-19 na cidade do Rio de Janeiro</span>
              <h1>Total</h1>
            </header>
            <Bar
              data={dataParsed(obitos)}
              options={options(obitos)}
              plugins={plugins}
            />
          </section>
          <footer>Dados disponibilizados via data.rio.</footer>
        </>
      )}
    </div>
  );
}
