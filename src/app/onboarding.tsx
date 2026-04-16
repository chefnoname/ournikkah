import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal,
  Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const NavRow = ({ onContinue, disabled }: { onContinue: () => void; disabled?: boolean }) => (
    <View style={styles.navRow}>
      <TouchableOpacity style={styles.backButton} onPress={() => goTo(screen - 1)}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.continueBtn, disabled && styles.btnDisabled]}
        onPress={onContinue}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text} />
      </TouchableOpacity>
    </View>
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
            <Animated.View entering={FadeIn.delay(200).duration(400)}>
              <Text style={styles.heroTitle}>Assalamu Alaykum</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(500).duration(400)}>
              <Text style={styles.heroSubtitle}>Let's plan your Nikah, the right way.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(800).duration(400)} style={{ width: '100%', marginTop: 32 }}>
              <PrimaryBtn onPress={() => goTo(2)}>Begin →</PrimaryBtn>
            </Animated.View>
          </View>
        );

      case 2:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <NavRow onContinue={() => goTo(3)} disabled={!data.userName.trim()} />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>What's your name?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>We'll use this to personalise your experience.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(450).duration(350)}>
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
            </Animated.View>
          </KeyboardAwareScrollView>
        );

      case 3:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <NavRow onContinue={() => goTo(4)} />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>And your partner's name?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>Optional — skip if you're starting alone.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(450).duration(350)}>
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
            </Animated.View>
            <Animated.View entering={FadeIn.delay(550).duration(350)}>
              <TouchableOpacity onPress={() => { update('partnerName', ''); goTo(4); }}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAwareScrollView>
        );

      case 4:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <NavRow
              onContinue={() => goTo(5)}
              disabled={!data.dateOption || (data.dateOption === 'exact' && !data.nikahDate)}
            />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>When is the big day?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>Don't worry — you can update this anytime.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(400).duration(350)}>
              <OptionCard selected={data.dateOption === 'exact'} onPress={() => update('dateOption', 'exact')}>
                <Text style={styles.optionTitle}>I have a date</Text>
                <Text style={styles.optionSubtitle}>Pick your exact Nikah date</Text>
              </OptionCard>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(500).duration(350)}>
              <OptionCard selected={data.dateOption === 'rough'} onPress={() => update('dateOption', 'rough')}>
                <Text style={styles.optionTitle}>I have a rough idea</Text>
                <Text style={styles.optionSubtitle}>Choose a season and year</Text>
              </OptionCard>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(600).duration(350)}>
              <OptionCard selected={data.dateOption === 'deciding'} onPress={() => update('dateOption', 'deciding')}>
                <Text style={styles.optionTitle}>Still deciding</Text>
                <Text style={styles.optionSubtitle}>No pressure — skip for now</Text>
              </OptionCard>
            </Animated.View>
            {data.dateOption === 'exact' && (
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Text style={data.nikahDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {data.nikahDate
                    ? new Date(data.nikahDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Select a date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.gold} />
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={data.nikahDate ? new Date(data.nikahDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) update('nikahDate', date.toISOString());
                }}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal transparent animationType="slide">
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalSheet}>
                    <TouchableOpacity style={styles.dateModalDone} onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateModalDoneText}>Done</Text>
                    </TouchableOpacity>
                    <DateTimePicker
                      value={data.nikahDate ? new Date(data.nikahDate) : new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      textColor="#1A1A1A"
                      themeVariant="light"
                      onChange={(_, date) => {
                        if (date) update('nikahDate', date.toISOString());
                      }}
                    />
                  </View>
                </View>
              </Modal>
            )}
            {data.dateOption === 'exact' && daysUntil && (
              <View style={styles.countdownPreview}>
                <Text style={styles.countdownDays}>{daysUntil}</Text>
                <Text style={styles.countdownLabel}>days until your Nikah</Text>
              </View>
            )}
            <Animated.View entering={FadeIn.delay(700).duration(350)} />
          </KeyboardAwareScrollView>
        );

      case 5:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <NavRow onContinue={() => goTo(6)} disabled={!data.ceremonyType} />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>What are you planning?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>This helps us show you what's most relevant.</Text>
            </Animated.View>
            {CEREMONY_OPTIONS.map((opt, i) => (
              <Animated.View key={opt.value} entering={FadeIn.delay(400 + i * 100).duration(350)}>
                <OptionCard selected={data.ceremonyType === opt.value} onPress={() => update('ceremonyType', opt.value)}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ fontSize: 24, marginTop: 2 }}>{opt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{opt.title}</Text>
                      <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                    </View>
                  </View>
                </OptionCard>
              </Animated.View>
            ))}
            <Animated.View entering={FadeIn.delay(750).duration(350)} />
          </KeyboardAwareScrollView>
        );

      case 6:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <NavRow
              onContinue={() => goTo(7)}
              disabled={!data.city || (data.city === 'Other' && !data.otherCity.trim())}
            />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>Where are you based?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>We'll show you venues and vendors near you.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(450).duration(350)}>
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
            </Animated.View>
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
            <Animated.View entering={FadeIn.delay(600).duration(350)}>
              <PrimaryBtn
                onPress={() => goTo(7)}
                disabled={!data.city || (data.city === 'Other' && !data.otherCity.trim())}
              >Continue →</PrimaryBtn>
            </Animated.View>
          </KeyboardAwareScrollView>
        );

      case 7:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <BackButton />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>How many guests?</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>A rough idea is fine — update anytime.</Text>
            </Animated.View>
            {GUEST_RANGES.map((g, i) => (
              <Animated.View key={g.value} entering={FadeIn.delay(400 + i * 80).duration(350)}>
                <OptionCard selected={data.guestRange === g.value} onPress={() => update('guestRange', g.value)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.optionTitle}>{g.label}</Text>
                    <Text style={styles.optionSubtitle}>{g.range}</Text>
                  </View>
                </OptionCard>
              </Animated.View>
            ))}
            <Animated.View entering={FadeIn.delay(800).duration(350)}>
              <PrimaryBtn onPress={() => goTo(8)} disabled={!data.guestRange}>Continue →</PrimaryBtn>
            </Animated.View>
          </KeyboardAwareScrollView>
        );

      case 8:
        return (
          <View style={styles.screenContent}>
            <BackButton />
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>Planning together is better.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>
                Invite your partner, friend or relative to your Our Nikkah space.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(450).duration(350)}>
              <PrimaryBtn onPress={handleSendInvite}>Invite to Our Nikkah</PrimaryBtn>
              <TouchableOpacity onPress={() => goTo(9)}>
                <Text style={styles.skipText}>I'll do this later</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        );

      case 9:
        return (
          <KeyboardAwareScrollView contentContainerStyle={styles.screenContent}>
            <Logo />
            <Animated.View entering={FadeIn.delay(150).duration(350)}>
              <Text style={styles.screenTitle}>Save your Nikah plan.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(300).duration(350)}>
              <Text style={styles.screenDesc}>Create an account to access your plan from any device.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(450).duration(350)}>
              <TextInput
                style={styles.dateInput}
                placeholder="Email address"
                placeholderTextColor={Colors.textSecondary}
                value={accountEmail}
                onChangeText={setAccountEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>
            <Animated.View entering={FadeIn.delay(550).duration(350)}>
              <TextInput
                style={styles.dateInput}
                placeholder="Create a password"
                placeholderTextColor={Colors.textSecondary}
                value={accountPassword}
                onChangeText={setAccountPassword}
                secureTextEntry
              />
            </Animated.View>
            <Animated.View entering={FadeIn.delay(650).duration(350)}>
              <PrimaryBtn onPress={handleContinueAsGuest} disabled={isSubmitting}>
                {accountEmail && accountPassword ? 'Create account' : 'Continue without an account'}
              </PrimaryBtn>
            </Animated.View>
          </KeyboardAwareScrollView>
        );

      case 10:
        return (
          <View style={styles.centered}>
            <Animated.View entering={FadeIn.delay(200).duration(500)}>
              <View style={styles.sparkleCircle}>
                <Ionicons name="sparkles" size={40} color={Colors.gold} />
              </View>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(500).duration(500)}>
              <Text style={styles.heroTitle}>
                Assalamu Alaykum,{'\n'}{data.userName}{data.partnerName ? ` & ${data.partnerName}` : ''}
              </Text>
            </Animated.View>
            {daysUntil && (
              <Animated.View entering={FadeIn.delay(800).duration(400)}>
                <Text style={styles.heroSubtitle}>
                  Your Nikah is in <Text style={{ fontWeight: '700', color: Colors.gold }}>{daysUntil} days.</Text>
                </Text>
              </Animated.View>
            )}
            <Animated.View entering={FadeIn.delay(1000).duration(400)}>
              <Text style={styles.heroSubtitle}>Let's make it beautiful.</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(1300).duration(400)} style={{ width: '100%', marginTop: 48 }}>
              <PrimaryBtn onPress={() => router.replace('/(tabs)/home')}>Open My Plan →</PrimaryBtn>
            </Animated.View>
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
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  continueBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansSemiBold,
    color: Colors.text,
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
    fontSize: 64,
    fontFamily: FontFamily.serifBold,
    color: Colors.gold,
    lineHeight: 72,
  },
  countdownLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  datePickerText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
    color: Colors.text,
  },
  datePickerPlaceholder: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
  dateModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dateModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 32,
  },
  dateModalDone: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  dateModalDoneText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
    color: Colors.gold,
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
