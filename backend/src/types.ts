export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

export interface GradeDistribution {
  label: string;
  value: number;
  color: string;
}

export interface FrequencyData {
  section: string;
  items: {
    question: string;
    values: {
      S: number;
      A: number;
      N: number;
    };
  }[];
}

export interface SchoolData {
  name: string;
  frequencyData: FrequencyData[];
  gradeDistribution: GradeDistribution[];
} 