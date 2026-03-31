import { Button } from '@/components/Button';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useFavourites } from '@/hooks/useFavourites';
import type { Item } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, error, isLoading } = useApi<Item>(`/products/${id}`);
  const { toggleFavourite, isFavourite } = useFavourites();

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false} style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  if (error || !item) {
    return (
      <ScreenWrapper scrollable={false} style={styles.center}>
        <Text style={styles.errorText}>Failed to load item</Text>
      </ScreenWrapper>
    );
  }

  const saved = isFavourite(item.id);

  return (
    <ScreenWrapper>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.rating}>★ {item.rating.rate}</Text>
          <Text style={styles.ratingCount}>({item.rating.count} reviews)</Text>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <Button
          title={saved ? '♥ Saved to Favourites' : '♡ Save to Favourites'}
          variant={saved ? 'primary' : 'outline'}
          onPress={() => toggleFavourite(item)}
          style={styles.saveButton}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
  },
  content: {
    gap: Spacing.sm,
  },
  category: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rating: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  ratingCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
});
