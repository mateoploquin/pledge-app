interface AppUsage {
  app: string;
  time: string;
  color: string;
  progress: number;
}

const data: AppUsage[] = [
  {
    app: "Instagram",
    time: "45m",
    color: "#F77E45",
    progress: 0.6,
  },
  {
    app: "Facebook",
    time: "25m",
    color: "#4167B2",
    progress: 0.3,
  },
  {
    app: "X",
    time: "25m",
    color: "#E4405F",
    progress: 0.3,
  },
];

export default data;
