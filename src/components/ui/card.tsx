import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

interface CardHeaderProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

interface CardContentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const Card = React.forwardRef<View, CardProps>(({ children, style }, ref) => (
  <View ref={ref} style={[styles.card, style]}>
    {children}
  </View>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, CardHeaderProps>(
  ({ children, style }, ref) => (
    <View ref={ref} style={[styles.header, style]}>
      {children}
    </View>
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<Text, CardTitleProps>(
  ({ children, style }, ref) => (
    <Text ref={ref} style={[styles.title, style]}>
      {children}
    </Text>
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<Text, CardDescriptionProps>(
  ({ children, style }, ref) => (
    <Text ref={ref} style={[styles.description, style]}>
      {children}
    </Text>
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, CardContentProps>(
  ({ children, style }, ref) => (
    <View ref={ref} style={[styles.content, style]}>
      {children}
    </View>
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, CardFooterProps>(
  ({ children, style }, ref) => (
    <View ref={ref} style={[styles.footer, style]}>
      {children}
    </View>
  )
);
CardFooter.displayName = 'CardFooter';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
});

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

