<template>
  <PolarisCard>
    <PolarisCardSection>
      <PolarisBlockStack gap="300">
        <PolarisInline gap="300" blockAlign="end">
          <div style="flex: 1;">
            <PolarisTextField
              label="Duration"
              required
              type="number"
              :min="1"
              :modelValue="config?.duration || 1"
              @update:modelValue="updateDuration($event)"
            />
          </div>
          <div>
            <PolarisSelect
              label="Unit"
              :modelValue="config?.unit || 'days'"
              @update:modelValue="updateUnit($event)"
              :options="unitOptions"
            />
          </div>
        </PolarisInline>

        <PolarisBanner variant="info">
          {{ config?.label || 'Wait [duration] [unit]' }}
        </PolarisBanner>
      </PolarisBlockStack>
    </PolarisCardSection>
  </PolarisCard>
</template>

<script>
import {
  PolarisCard,
  PolarisCardSection,
  PolarisBlockStack,
  PolarisInline,
  PolarisTextField,
  PolarisSelect,
  PolarisBanner,
} from 'polaris-weweb-styles/components';

const unitOptions = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

export default {
  name: 'WaitConfig',
  components: {
    PolarisCard,
    PolarisCardSection,
    PolarisBlockStack,
    PolarisInline,
    PolarisTextField,
    PolarisSelect,
    PolarisBanner,
  },
  props: {
    config: { type: Object, required: true },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const updateDuration = (value) => {
      const duration = parseInt(value) || 0;
      const unit = props.config?.unit || 'days';
      const label = duration > 0 ? `Wait ${duration} ${unit}` : 'Wait';
      emit('update', { ...props.config, duration, label });
    };

    const updateUnit = (unit) => {
      const duration = props.config?.duration || 1;
      const label = `Wait ${duration} ${unit}`;
      emit('update', { ...props.config, unit, label });
    };

    return { unitOptions, updateDuration, updateUnit };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

:deep(.polaris-card) {
  @include polaris-tokens;
}
</style>
