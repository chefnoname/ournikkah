import { Card } from '@/components/Card';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { BorderRadius, Colors, FontSize, Spacing } from '@/constants/theme';
import { useApi } from '@/hooks/useApi';
import { useFavourites } from '@/hooks/useFavourites';
import type { Item } from '@/types';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { data: items, error, isLoading } = useApi<Item[]>('/products');
  const router = useRouter();
  const { isFavourite } = useFavourites();

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false} style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper scrollable={false} style={styles.center}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push(`/items/${item.id}`)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                {isFavourite(item.id) && (
                  <Text style={styles.savedBadge}>♥ Saved</Text>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  savedBadge: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
