import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const CITIES = ['London', 'Birmingham', 'Manchester', 'Leeds', 'Bradford', 'Leicester', 'Sheffield', 'Glasgow', 'Other'];
const GUEST_RANGES = [
  { value: 'intimate', label: 'Intimate', range: 'Up to 50' },
  { value: 'small', label: 'Small', range: '50–100' },
  { value: 'medium', label: 'Medium', range: '100–250' },
  { value: 'large', label: 'Large', range: '250–500' },
  { value: 'grand', label: 'Grand', range: '500+' },
];
const CEREMONY_OPTIONS = [
  { value: 'nikah_only', title: 'Nikah ceremony only', subtitle: 'Just the Nikah — intimate and sacred', icon: '🕌' },
  { value: 'nikah_and_wedding', title: 'Nikah & Wedding celebration', subtitle: 'The ceremony and a full reception', icon: '💍' },
  { value: 'not_sure', title: 'Not sure yet', subtitle: "We'll help you figure it out", icon: '✨' },
];

export default function Onboarding() {
  const router = useRouter();
  const { workspaceId, saveOnboarding } = useWorkspace();
  const [screen, setScreen] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const directionRef = useRef<'forward' | 'back'>('forward');
  const [data, setData] = useState({
    userName: '',
    partnerName: '',
    dateOption: null as 'exact' | 'rough' | 'deciding' | null,
    nikahDate: '',
    roughSeason: '',
    roughYear: '',
    ceremonyType: null as string | null,
    city: '',
    otherCity: '',
    guestRange: '',
  });
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');

  const update = (field: string, value: any) => setData(prev => ({ ...prev, [field]: value }));
  const goTo = useCallback((n: number) => {
    directionRef.current = n > screen ? 'forward' : 'back';
    setScreen(n);
  }, [screen]);

  const entering = directionRef.current === 'forward'
    ? SlideInRight.duration(350)
    : SlideInLeft.duration(350);
  const exiting = directionRef.current === 'forward'
    ? SlideOutLeft.duration(250)
    : SlideOutRight.duration(250);

  const daysUntil = useMemo(() => {
    if (!data.nikahDate) return null;
    const diff = Math.ceil((new Date(data.nikahDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [data.nikahDate]);

  const guestRangeToLabel = (v: string) => GUEST_RANGES.find(g => g.value === v)?.range || v;

  const doSaveOnboarding = async () => {
    const location = data.city === 'Other' ? data.otherCity : data.city;
    await saveOnboarding({
      userName: data.userName || null,
      partnerName: data.partnerName || null,
      ceremonyType: data.ceremonyType || null,
      baseLocation: location || 'London',
      name: data.partnerName ? `${data.userName} & ${data.partnerName}` : data.userName || 'My Nikkah',
      hasNikah: data.ceremonyType !== 'not_sure',
      hasWalima: data.ceremonyType === 'nikah_and_wedding',
      nikahDate: data.dateOption === 'exact' && data.nikahDate ? data.nikahDate : null,
      nikahSeason: data.dateOption === 'rough' ? data.roughSeason : null,
      nikahYear: data.dateOption === 'rough' ? data.roughYear : null,
      guestCount: data.guestRange ? guestRangeToLabel(data.guestRange) : null,
    });
  };

  const handleContinueAsGuest = async () => {
    setIsSubmitting(true);
    try {
      await doSaveOnboarding();
      goTo(10);
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!workspaceId) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.invite.path, { id: workspaceId }));
      const res = await fetchWithAuth(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      const inviteUrl = d.inviteUrl || `Share code: ${d.inviteCode}`;
      await Clipboard.setStringAsync(inviteUrl);
      Alert.alert('Invite link copied!', 'Share it with your partner or family.');
      setTimeout(() => goTo(9), 500);
    } catch {
      Alert.alert('Error', 'Could not create invite');
    }
  };

  const BackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => goTo(screen - 1)}>
      <Ionicons name="chevron-back" size={20} color={Colors.text} />
    </TouchableOpacity>
  );

  const Logo = () => <Text style={styles.logo}>MyNikkah</Text>;

  const PrimaryBtn = ({ onPress, disabled, children }: { onPress: () => void; disabled?: boolean; children: string }) => (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{children}</Text>}
    </TouchableOpacity>
  );

  const OptionCard = ({ selected, onPress, children }: { selected: boolean; onPress: () => void; children: React.ReactNode }) => (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );

  const renderScreen = () => {
    switch (screen) {
      case 1:
        return (
          <View style={styles.centered}>
            <Text style={styles.heroTitle}>Assalamu Alaykum</Text>
            <Text style={styles.heroSubtitle}>Let's plan your Nikah, the right way.</Text>
            <View style={{ width: '100%', marginTop: 32 }}>
              <PrimaryBtn onPress={() => goTo(2)}>Begin →</PrimaryBtn>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>What's your name?</Text>
            <Text style={styles.screenDesc}>We'll use this to personalise your experience.</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Fatima"
              placeholderTextColor="rgba(107,107,107,0.4)"
              value={data.userName}
              onChangeText={v => update('userName', v)}
              autoFocus
              selectionColor={Colors.gold}
              underlineColorAndroid="transparent"
            />
            <PrimaryBtn onPress={() => goTo(3)} disabled={!data.userName.trim()}>Continue →</PrimaryBtn>
          </View>
        );

      case 3:
        return (
          <View style={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>And your partner's name?</Text>
            <Text style={styles.screenDesc}>Optional — skip if you're starting alone.</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Ahmed"
              placeholderTextColor="rgba(107,107,107,0.4)"
              value={data.partnerName}
              onChangeText={v => update('partnerName', v)}
              autoFocus
              selectionColor={Colors.gold}
              underlineColorAndroid="transparent"
            />
            <PrimaryBtn onPress={() => goTo(4)}>Continue →</PrimaryBtn>
            <TouchableOpacity onPress={() => { update('partnerName', ''); goTo(4); }}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        return (
          <ScrollView contentContainerStyle={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>When is the big day?</Text>
            <Text style={styles.screenDesc}>Don't worry — you can update this anytime.</Text>
            <OptionCard selected={data.dateOption === 'exact'} onPress={() => update('dateOption', 'exact')}>
              <Text style={styles.optionTitle}>I have a date</Text>
              <Text style={styles.optionSubtitle}>Pick your exact Nikah date</Text>
            </OptionCard>
            <OptionCard selected={data.dateOption === 'rough'} onPress={() => update('dateOption', 'rough')}>
              <Text style={styles.optionTitle}>I have a rough idea</Text>
              <Text style={styles.optionSubtitle}>Choose a season and year</Text>
            </OptionCard>
            <OptionCard selected={data.dateOption === 'deciding'} onPress={() => update('dateOption', 'deciding')}>
              <Text style={styles.optionTitle}>Still deciding</Text>
              <Text style={styles.optionSubtitle}>No pressure — skip for now</Text>
            </OptionCard>
            {data.dateOption === 'exact' && (
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={data.nikahDate}
                onChangeText={v => update('nikahDate', v)}
              />
            )}
            {data.dateOption === 'exact' && daysUntil && (
              <View style={styles.countdownPreview}>
                <Text style={styles.countdownDays}>{daysUntil} days</Text>
                <Text style={styles.countdownLabel}>until your Nikah</Text>
              </View>
            )}
            <PrimaryBtn
              onPress={() => goTo(5)}
              disabled={!data.dateOption || (data.dateOption === 'exact' && !data.nikahDate)}
            >Continue →</PrimaryBtn>
          </ScrollView>
        );

      case 5:
        return (
          <ScrollView contentContainerStyle={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>What are you planning?</Text>
            <Text style={styles.screenDesc}>This helps us show you what's most relevant.</Text>
            {CEREMONY_OPTIONS.map(opt => (
              <OptionCard key={opt.value} selected={data.ceremonyType === opt.value} onPress={() => update('ceremonyType', opt.value)}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Text style={{ fontSize: 24, marginTop: 2 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                  </View>
                </View>
              </OptionCard>
            ))}
            <PrimaryBtn onPress={() => goTo(6)} disabled={!data.ceremonyType}>Continue →</PrimaryBtn>
          </ScrollView>
        );

      case 6:
        return (
          <ScrollView contentContainerStyle={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>Where are you based?</Text>
            <Text style={styles.screenDesc}>We'll show you venues and vendors near you.</Text>
            <View style={styles.chipRow}>
              {CITIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, data.city === c && styles.chipSelected]}
                  onPress={() => update('city', c)}
                >
                  <Text style={[styles.chipText, data.city === c && styles.chipTextSelected]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {data.city === 'Other' && (
              <TextInput
                style={styles.dateInput}
                placeholder="Which city?"
                placeholderTextColor={Colors.textSecondary}
                value={data.otherCity}
                onChangeText={v => update('otherCity', v)}
                autoFocus
              />
            )}
            <PrimaryBtn
              onPress={() => goTo(7)}
              disabled={!data.city || (data.city === 'Other' && !data.otherCity.trim())}
            >Continue →</PrimaryBtn>
          </ScrollView>
        );

      case 7:
        return (
          <ScrollView contentContainerStyle={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>How many guests?</Text>
            <Text style={styles.screenDesc}>A rough idea is fine — update anytime.</Text>
            {GUEST_RANGES.map(g => (
              <OptionCard key={g.value} selected={data.guestRange === g.value} onPress={() => update('guestRange', g.value)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.optionTitle}>{g.label}</Text>
                  <Text style={styles.optionSubtitle}>{g.range}</Text>
                </View>
              </OptionCard>
            ))}
            <PrimaryBtn onPress={() => goTo(8)} disabled={!data.guestRange}>Continue →</PrimaryBtn>
          </ScrollView>
        );

      case 8:
        return (
          <View style={styles.screenContent}>
            <BackButton />
            <Logo />
            <Text style={styles.screenTitle}>Planning together is better.</Text>
            <Text style={styles.screenDesc}>
              Invite your partner, friend or relative to your Our Nikkah space.
            </Text>
            <PrimaryBtn onPress={handleSendInvite}>Invite to Our Nikkah</PrimaryBtn>
            <TouchableOpacity onPress={() => goTo(9)}>
              <Text style={styles.skipText}>I'll do this later</Text>
            </TouchableOpacity>
          </View>
        );

      case 9:
        return (
          <ScrollView contentContainerStyle={styles.screenContent}>
            <Logo />
            <Text style={styles.screenTitle}>Save your Nikah plan.</Text>
            <Text style={styles.screenDesc}>Create an account to access your plan from any device.</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="Email address"
              placeholderTextColor={Colors.textSecondary}
              value={accountEmail}
              onChangeText={setAccountEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.dateInput}
              placeholder="Create a password"
              placeholderTextColor={Colors.textSecondary}
              value={accountPassword}
              onChangeText={setAccountPassword}
              secureTextEntry
            />
            <PrimaryBtn onPress={handleContinueAsGuest} disabled={isSubmitting}>
              {accountEmail && accountPassword ? 'Create account' : 'Continue without an account'}
            </PrimaryBtn>
          </ScrollView>
        );

      case 10:
        return (
          <View style={styles.centered}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={40} color={Colors.gold} />
            </View>
            <Text style={styles.heroTitle}>
              Assalamu Alaykum,{'\n'}{data.userName}{data.partnerName ? ` & ${data.partnerName}` : ''}
            </Text>
            {daysUntil && (
              <Text style={styles.heroSubtitle}>
                Your Nikah is in <Text style={{ fontWeight: '700', color: Colors.gold }}>{daysUntil} days.</Text>
              </Text>
            )}
            <Text style={styles.heroSubtitle}>Let's make it beautiful.</Text>
            <View style={{ width: '100%', marginTop: 48 }}>
              <PrimaryBtn onPress={() => router.replace('/(tabs)/home')}>Open My Plan →</PrimaryBtn>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Animated.View
          key={screen}
          entering={screen === 1 ? FadeIn.duration(400) : entering}
          exiting={screen === 1 ? FadeOut.duration(200) : exiting}
          style={styles.animatedContainer}
        >
          {renderScreen()}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  animatedContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  screenContent: {
    flexGrow: 1,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logo: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  screenTitle: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  screenDesc: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
    paddingBottom: Spacing.sm,
    marginVertical: Spacing.md,
    // @ts-ignore — web only: removes browser default blue focus ring
    outlineWidth: 0,
  },
  dateInput: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.1)',
  },
  optionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(26,26,26,0.1)',
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldLight,
  },
  optionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
    color: Colors.text,
  },
  optionSubtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansMedium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: '#fff',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
  },
  skipText: {
    textAlign: 'center',
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  countdownPreview: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  countdownDays: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.serifBold,
    color: Colors.gold,
  },
  countdownLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
  sparkleCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});
