import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Bar } from 'react-chartjs-2';

import './App.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [falecimentos, setFalecimentos] = useState([]);
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

      const falecimentosUrl =
        'https://services1.arcgis.com/OlP4dGNtIcnD3RYf/arcgis/rest/services/Casos_individuais_3/FeatureServer/0/query?f=json&where=extra_3_dt%20IS%20NOT%20NULL%20AND%20extra_3_dt%3C%3E%2701%2F00%2F00%27%20AND%20extra_3_dt%3C%3E%27Missing%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&groupByFieldsForStatistics=extra_3_dt&orderByFields=extra_3_dt%20asc&outStatistics=%5B%7B%22statisticType%22%3A%22count%22%2C%22onStatisticField%22%3A%22ObjectId2%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true';

      const obitosJson = await axios.get(obitosUrl);
      const falecimentosJson = await axios.get(falecimentosUrl);

      const response = JSON.parse(obitosJson.request.response);
      const responseF = JSON.parse(falecimentosJson.request.response);

      const starDate = new Date('03-06-2020');

      const geral = await response.features.map((item, index) => {
        const perDay =
          index === 0
            ? item.attributes.Soma_por_dia
            : item.attributes.Soma_por_dia -
              response.features[index - 1].attributes.Soma_por_dia;

        // if (item.attributes.Data === 47) {
        //   const a = [
        //     {
        //       date: addDays(starDate, Number(item.attributes.Data)),
        //       perDay,
        //       ...item.attributes,
        //     },
        //     {
        //       date: addDays(starDate, 48),
        //       perDay: 303,
        //       ...item.attributes,
        //       Data: 48,
        //     },
        //     {
        //       date: addDays(starDate, 49),
        //       perDay: 322,
        //       ...item.attributes,
        //       Data: 49,
        //     },
        //   ];
        //   return a.keys;
        // }

        return {
          date: addDays(starDate, Number(item.attributes.Data)),
          perDay,
          ...item.attributes,
        };
      });

      geral.splice(
        34,
        0,
        {
          date: new Date('04-23-2020'),
          perDay: 20,
          Soma_por_dia: 303,
          Data: 48,
        },
        {
          date: new Date('04-24-2020'),
          perDay: 19,
          Soma_por_dia: 322,
          Data: 49,
        }
      );

      const geralF = await responseF.features.map((item, index) => {
        // const perDay =
        //   index === 0
        //     ? item.attributes.Soma_por_dia
        //     : item.attributes.Soma_por_dia -
        //       response.features[index - 1].attributes.Soma_por_dia;

        return {
          date: new Date(item.attributes.extra_3_dt),
          perDay: item.attributes.value,
        };
      });

      // 0:
      //   attributes:
      //     extra_3_dt: "03/19/20"
      //     value: 2

      console.log(geral);
      console.log(geralF);

      const ultimos15dias = geral.slice(Math.max(geral.length - 15, 1));

      setObitos(geral);
      setObitos15(ultimos15dias);
      setFalecimentos(geralF);
      setLoading(false);
    })();
  }, []);

  const lineColor = '#ff1700';
  const lineColor2 = '#333333';
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

  const dataParsedF = useCallback(() => {
    return {
      datasets: [
        {
          label: 'Falecimentos no dia',
          type: 'line',
          data: [...falecimentos.map((item) => item.perDay, {})],
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
          label: 'Óbitos registrados no dia',
          type: 'line',
          data: [{}, ...obitos.map((item) => item.perDay)],
          fill: false,
          borderColor: lineColor2,
          backgroundColor: lineColor2,
          pointBorderColor: lineColor2,
          pointBackgroundColor: lineColor2,
          pointHoverBackgroundColor: lineColor2,
          pointHoverBorderColor: lineColor2,
          yAxisID: 'y-axis-3',
        },
        {
          type: 'bar',
          label: 'Total de mortes',
          data: [{}, ...obitos.map((item) => item.Soma_por_dia)],
          fill: false,
          backgroundColor: barsColor,
          borderColor: barsColor,
          hoverBackgroundColor: barsColor,
          hoverBorderColor: barsColor,
          yAxisID: 'y-axis-1',
        },
      ],
    };
  }, [falecimentos, obitos]);

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

  const optionsF = (dataOptions) => {
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
            labels: [
              '19/03',
              ...dataOptions.map((item) => dateFormatted(item.date)),
            ],
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
            id: 'y-axis-3',
            gridLines: {
              display: true,
            },
            labels: {
              show: true,
            },
            ticks: {
              max: 230,
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
            ticks: {
              max: 230,
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

  console.log(dataParsed(obitos));
  console.log(dataParsedF());

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
          <section>
            <header>
              <span>Óbitos por COVID-19 na cidade do Rio de Janeiro</span>
              <h1>Comparativo Registro no dia / Falecimento no dia</h1>
            </header>
            <Bar
              data={dataParsedF()}
              options={optionsF(obitos)}
              plugins={plugins}
            />
          </section>
          <footer>Dados disponibilizados via data.rio.</footer>
        </>
      )}
    </div>
  );
}
