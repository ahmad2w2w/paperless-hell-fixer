import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, fontSize, spacing } from '../../lib/theme';

type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  dot?: boolean;
};

export function Badge({ children, color = 'default', size = 'md', dot = false }: BadgeProps) {
  const { theme } = useTheme();

  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primaryLight,
          textColor: theme.colors.primary,
          dotColor: theme.colors.primary,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.successLight,
          textColor: theme.colors.success,
          dotColor: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warningLight,
          textColor: theme.colors.warning,
          dotColor: theme.colors.warning,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.dangerLight,
          textColor: theme.colors.danger,
          dotColor: theme.colors.danger,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.infoLight,
          textColor: theme.colors.info,
          dotColor: theme.colors.info,
        };
      default:
        return {
          backgroundColor: theme.colors.background,
          textColor: theme.colors.foregroundMuted,
          dotColor: theme.colors.foregroundSubtle,
        };
    }
  };

  const colorStyles = getColorStyles();
  const isDefault = color === 'default';

  return (
    <View
      style={[
        styles.container,
        size === 'sm' ? styles.containerSm : styles.containerMd,
        { backgroundColor: colorStyles.backgroundColor },
        isDefault ? { borderWidth: 1, borderColor: theme.colors.border } : undefined,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colorStyles.dotColor },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colorStyles.textColor },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  containerSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
  },
  containerMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  dot: {
    marginRight: spacing.xs,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '500',
  },
  textSm: {
    fontSize: fontSize.xs - 1,
  },
  textMd: {
    fontSize: fontSize.xs,
  },
});
