export const getDifficulty = (level) => {
  const configs = {
    1: { gridSize: 3, routeLength: 2 }, 2: { gridSize: 3, routeLength: 3 },
    3: { gridSize: 4, routeLength: 3 }, 4: { gridSize: 4, routeLength: 4 },
    5: { gridSize: 5, routeLength: 4 }, 6: { gridSize: 5, routeLength: 5 },
    7: { gridSize: 6, routeLength: 5 }, 8: { gridSize: 6, routeLength: 6 },
    9: { gridSize: 7, routeLength: 6 }, 10: { gridSize: 7, routeLength: 7 }
  };
  return configs[level] || configs[1];
};