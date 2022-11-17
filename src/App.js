import "./App.css";
import React, { useState } from "react";
import { Row, Col, Card, Layout, DatePicker, Menu } from "antd";
import { GithubOutlined } from "@ant-design/icons";
import "antd/dist/antd.css";
import BarChartRace from "./BarchartRace";
import * as d3 from "d3";
import moment from "moment";

const AppLayout = ({ children }) => (
  <Layout>
    <Layout.Header>
      <div
        style={{
          float: "left",
        }}
      >
        <h2
          style={{
            color: "#fff",
            margin: 0,
            marginRight: "1em",
          }}
        >
          HackerNews Who's Hiring: Analytics
        </h2>
      </div>
      <div
        style={{
          float: "right",
        }}
      >
        <Menu theme="dark" mode="horizontal" style={{ lineHeight: "64px" }}>
          <Menu.Item key="1">
            <a href="https://github.com/ybashir/hn-dashboard">
              <GithubOutlined />
              &nbsp; Github
            </a>
          </Menu.Item>
        </Menu>
      </div>
    </Layout.Header>
    <Layout.Content
      style={{
        padding: "0 25px 25px 25px",
        margin: "25px auto",
        width: "100%",
        maxWidth: 1200,
      }}
    >
      {children}
    </Layout.Content>
  </Layout>
);

const Dashboard = ({
  children,
  onPreAggChange,
  onDateRangeChange,
  onCategoryChange,
}) => [
  <Row type="flex" justify="space-around" align="top">
    <Col span={24} lg={24} align="right">
      <DatePicker.RangePicker
        picker={"month"}
        onChange={(date, dateString) => onDateRangeChange(dateString)}
        defaultValue={[
          moment("2014/01/01", "YYYY/MM/DD"),
          moment("2022/11/01", "YYYY/MM/DD"),
        ]}
      />
    </Col>
  </Row>,
  <Row type="flex" justify="space-around" align="top" gutter={24}>
    {children}
  </Row>,
];

const DashboardItem = ({ children, title, size, height }) => (
  <Col span={24} lg={size}>
    <Card
      title={title}
      style={{
        marginBottom: "24px",
      }}
    >
      <div style={{ height: height }}>{children}</div>
    </Card>
  </Col>
);

DashboardItem.defaultProps = {
  size: 12,
};

function App() {
  var dataset1 = d3.csv("data/tech_by_month_flat.csv", function (d) {
    return {
      date: new Date(d.date),
      name: d.name,
      category: d.category,
      value: +d.value,
    };
  });
  var dataset2 = d3.csv("data/location_by_month_flat.csv", function (d) {
    return {
      date: new Date(d.date),
      name: d.name,
      category: d.category,
      value: +d.value,
    };
  });

  const [dateRange, setDateRange] = useState(0);
  return (
    <div className="App">
      <AppLayout>
        <Dashboard
          onDateRangeChange={(dateRange) => {
            if (dateRange[0] !== "" && dateRange[1] !== "") {
              setDateRange(dateRange);
            }
          }}
        >
          <DashboardItem
            size={24}
            title="Most popular tech keywords in HN job ads"
          >
            <BarChartRace
              dataset={dataset1}
              bars={12}
              barSize={32}
              dateRange={dateRange}
              margin={{
                top: 20,
                right: 6,
                bottom: 6,
                left: 0,
              }}
            />
          </DashboardItem>
          <DashboardItem size={24} title="Most popular locations in HN job ads">
            <BarChartRace
              dataset={dataset2}
              bars={12}
              barSize={32}
              dateRange={dateRange}
              margin={{
                top: 20,
                right: 6,
                bottom: 6,
                left: 0,
              }}
            />
          </DashboardItem>
        </Dashboard>
      </AppLayout>
    </div>
  );
}
export default App;
