export interface FrequencyData {
  title: string;
  questions?: Question[];
}

export interface Question {
  text: string;
  frequencies?: {
    S?: number;
    A?: number;
    N?: number;
  };
} 