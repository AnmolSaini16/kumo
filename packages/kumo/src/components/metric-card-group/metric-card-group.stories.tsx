import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "../metric-card/metric-card";
import { MetricCardGroup } from "./metric-card-group";

const meta = {
  title: "Components/MetricCardGroup",
  component: MetricCardGroup,
} satisfies Meta<typeof MetricCardGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <MetricCardGroup title="Overview">
      <MetricCard label="Requests" value="1.2M" />
      <MetricCard label="Errors" value="42" />
    </MetricCardGroup>
  ),
};
