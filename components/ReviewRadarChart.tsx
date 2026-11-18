import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

type ReviewRadarChartProps = {
  overall: number;
  environment: number;
  comfort: number;
};

export default function ReviewRadarChart({
  overall,
  environment,
  comfort,
}: ReviewRadarChartProps) {

  // Chart dimensions
  const centerX = 150;
  const centerY = 140;
  const radius = 90;

  // Convert a rating into a position on the chart
  const getPoint = (value: number, angle: number) => {
    const distance = (value / 5) * radius;

    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);

    return `${x},${y}`;
  };

  // Three rating axes
  const points = [
    getPoint(overall, -Math.PI / 2),
    getPoint(environment, Math.PI / 6),
    getPoint(comfort, (5 * Math.PI) / 6),
  ].join(' ');

  // Background grid
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rating Breakdown</Text>

      <Svg width="300" height="280" viewBox="0 0 300 280">

        {/* Background grid */}
        {gridLevels.map((level) => {
          const gridPoints = [
            getPoint(level, -Math.PI / 2),
            getPoint(level, Math.PI / 6),
            getPoint(level, (5 * Math.PI) / 6),
          ].join(' ');

          return (
            <Polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1"
            />
          );
        })}

        {/* Rating axes */}
        {[ -Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6 ].map((angle, index) => (
          <Line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(angle)}
            y2={centerY + radius * Math.sin(angle)}
            stroke="#D1D5DB"
            strokeWidth="1"
          />
        ))}

        {/* Student rating shape */}
        <Polygon
          points={points}
          fill="rgba(190, 10, 46, 0.25)"
          stroke="#484649"
          strokeWidth="2"
        />

        {/* Rating labels */}
        <SvgText x="150" y="25" textAnchor="middle" fontSize="12" fill="#333">
          Overall
        </SvgText>

        <SvgText x="265" y="205" textAnchor="middle" fontSize="12" fill="#333">
          Environment
        </SvgText>

        <SvgText x="35" y="205" textAnchor="middle" fontSize="12" fill="#333">
          Comfort
        </SvgText>

        {/* Center point */}
        <Circle cx={centerX} cy={centerY} r="3" fill="#8B1E2D" />

      </Svg>

      <Text style={styles.subtitle}>
        Ratings are measured from 1 to 5
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 12,
    color: '#4f4f4f',
    marginTop: 4,
  },
});