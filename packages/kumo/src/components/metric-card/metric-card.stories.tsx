import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "./metric-card";

const meta = {
  title: "Components/MetricCard",
  component: MetricCard,
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Requests",
    value: "1.2M",
  },
};
