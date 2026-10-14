import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface AgendaCardItem {
  id: string;
  desde: string;
  hasta: string;
  duration: string;
  titulo: string;
  organizador?: string | null;
  correo_organizador?: string | null;
  isAvailable: boolean;
  isCurrentNow?: boolean;
  fecha?: string;
  zona_horaria?: string;
  salaNombre?: string;
}

export const DEFAULT_AGENDA_ITEMS: AgendaCardItem[] = [
  {
    id: 'slot-1',
    desde: '08:00 AM',
    hasta: '09:00 AM',
    duration: '1 hora',
    titulo: 'Disponible',
    isAvailable: true,
    isCurrentNow: false,
    fecha: '09/10/2026',
    zona_horaria: 'America/Caracas',
    salaNombre: 'Sala SOCADO',
  },
  {
    id: 'slot-2',
    desde: '09:00 AM',
    hasta: '10:00 AM',
    duration: '1 hora',
    titulo: 'Manuel Chacin',
    organizador: 'Manuel Chacin',
    correo_organizador: 'mchacin@socadocafe.com',
    isAvailable: false,
    isCurrentNow: false,
    fecha: '09/10/2026',
    zona_horaria: 'America/Caracas',
    salaNombre: 'Sala SOCADO',
  },
  {
    id: 'slot-3',
    desde: '10:00 AM',
    hasta: '12:00 PM',
    duration: '2 horas',
    titulo: 'Disponible',
    isAvailable: true,
    isCurrentNow: true,
    fecha: '09/10/2026',
    zona_horaria: 'America/Caracas',
    salaNombre: 'Sala SOCADO',
  },
  {
    id: 'slot-4',
    desde: '12:00 PM',
    hasta: '01:00 PM',
    duration: '1 hora',
    titulo: 'Andrea Di Natale',
    organizador: 'Andrea Di Natale',
    correo_organizador: 'anatale@kaizenholdings.net',
    isAvailable: false,
    isCurrentNow: false,
    fecha: '09/10/2026',
    zona_horaria: 'America/Caracas',
    salaNombre: 'Sala SOCADO',
  },
];

const ITEM_HEIGHT = 72;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  if (rangeSize <= 0) return 0;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface ChipItemProps {
  item: AgendaCardItem;
  index: number;
  selectedIndex: number;
  totalLength: number;
  onPress: (index: number) => void;
  isDark: boolean;
}

function ChipItem({ item, index, selectedIndex, totalLength, onPress, isDark }: ChipItemProps) {
  const isActive = index === selectedIndex;
  const distance = index - selectedIndex;
  const wrappedDistance =
    totalLength <= 1 ? 0 : wrap(-(totalLength / 2), totalLength / 2, distance);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(wrappedDistance * ITEM_HEIGHT, {
            damping: 24,
            stiffness: 110,
            mass: 0.9,
          }),
        },
      ],
      opacity: withTiming(Math.max(0.25, 1 - Math.abs(wrappedDistance) * 0.32), {
        duration: 240,
      }),
    };
  }, [wrappedDistance]);

  const statusColor = item.isAvailable
    ? (isDark ? '#34C759' : '#15803D')
    : (isDark ? '#FF453A' : '#DC2626');

  return (
    <Animated.View style={[styles.chipWrapper, animatedStyle]}>
      <Pressable
        onPress={() => onPress(index)}
        style={({ pressed }) => [
          styles.chipButton,
          isDark ? styles.chipButtonDark : styles.chipButtonLight,
          isActive && (isDark ? styles.chipButtonActiveDark : styles.chipButtonActiveLight),
          pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        ]}>
        {/* Glow sutil en el estado activo */}
        {isActive && (
          <LinearGradient
            colors={
              item.isAvailable
                ? (isDark ? ['rgba(52, 199, 89, 0.18)', 'rgba(52, 199, 89, 0.04)'] : ['rgba(52, 199, 89, 0.12)', 'rgba(255, 255, 255, 0.6)'])
                : (isDark ? ['rgba(255, 69, 58, 0.18)', 'rgba(255, 69, 58, 0.04)'] : ['rgba(239, 68, 68, 0.10)', 'rgba(255, 255, 255, 0.6)'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.chipLeftIcon}>
          <Ionicons
            name={item.isAvailable ? 'checkmark-circle' : 'time'}
            size={18}
            color={statusColor}
          />
        </View>

        <View style={styles.chipTextCol}>
          <Text
            numberOfLines={1}
            style={[
              styles.chipTimeText,
              isDark ? styles.textDark : styles.textLight,
              isActive && styles.chipTimeActive,
            ]}>
            {item.desde} — {item.hasta}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.chipSubText,
              isDark ? styles.textMutedDark : styles.textMutedLight,
              isActive && { color: statusColor, fontWeight: '700' },
            ]}>
            {item.isAvailable ? 'Disponible' : item.titulo}
          </Text>
        </View>

        {item.isCurrentNow && (
          <View style={[styles.nowBadgeMini, isDark ? styles.nowBadgeMiniDark : styles.nowBadgeMiniLight]}>
            <View style={styles.pulseDot} />
            <Text style={styles.nowBadgeMiniText}>AHORA</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface CardItemProps {
  item: AgendaCardItem;
  index: number;
  selectedIndex: number;
  totalLength: number;
  cardWidth: number;
  cardHeight: number;
  onPressCard?: () => void;
  isDark: boolean;
}

function CardItem({
  item,
  index,
  selectedIndex,
  totalLength,
  cardWidth,
  cardHeight,
  onPressCard,
  isDark,
}: CardItemProps) {
  const diff = index - selectedIndex;
  let normalizedDiff = diff;
  if (totalLength > 1) {
    if (diff > totalLength / 2) normalizedDiff -= totalLength;
    if (diff < -totalLength / 2) normalizedDiff += totalLength;
  } else {
    normalizedDiff = 0;
  }

  const isActive = normalizedDiff === 0;
  const isPrev =
    totalLength > 1 &&
    (normalizedDiff === -1 || (totalLength === 2 && normalizedDiff === 1 && !isActive));
  const isNext = totalLength > 2 ? normalizedDiff === 1 : false;

  const animatedCardStyle = useAnimatedStyle(() => {
    const targetX = isActive ? 0 : isPrev ? -70 : isNext ? 70 : 0;
    const targetScale = isActive ? 1 : isPrev || isNext ? 0.90 : 0.74;
    const targetOpacity = isActive ? 1 : isPrev || isNext ? 0.50 : 0;
    const targetRotate = isActive ? '0deg' : isPrev ? '-2deg' : isNext ? '2deg' : '0deg';
    const targetZIndex = isActive ? 20 : isPrev || isNext ? 10 : 0;

    return {
      zIndex: targetZIndex,
      opacity: withTiming(targetOpacity, { duration: 260 }),
      transform: [
        {
          translateX: withSpring(targetX, {
            damping: 26,
            stiffness: 200,
            mass: 0.8,
          }),
        },
        {
          scale: withSpring(targetScale, {
            damping: 26,
            stiffness: 200,
            mass: 0.8,
          }),
        },
        {
          rotate: withSpring(targetRotate, {
            damping: 26,
            stiffness: 200,
            mass: 0.8,
          }),
        },
      ],
    };
  }, [isActive, isPrev, isNext]);

  const statusColor = item.isAvailable
    ? (isDark ? '#34C759' : '#15803D')
    : (isDark ? '#FF453A' : '#DC2626');

  const statusBg = item.isAvailable
    ? (isDark ? 'rgba(52, 199, 89, 0.18)' : 'rgba(52, 199, 89, 0.12)')
    : (isDark ? 'rgba(255, 69, 58, 0.18)' : 'rgba(239, 68, 68, 0.10)');

  const statusBorder = item.isAvailable
    ? (isDark ? 'rgba(52, 199, 89, 0.40)' : 'rgba(52, 199, 89, 0.32)')
    : (isDark ? 'rgba(255, 69, 58, 0.40)' : 'rgba(239, 68, 68, 0.30)');

  // Gradientes de Vidrio Escarchado tipo Apple
  const glassGradientColors: [string, string, string] = item.isAvailable
    ? (isDark
        ? ['rgba(22, 34, 28, 0.92)', 'rgba(17, 26, 22, 0.88)', 'rgba(12, 19, 16, 0.85)']
        : ['rgba(255, 255, 255, 0.95)', 'rgba(240, 253, 244, 0.92)', 'rgba(230, 249, 237, 0.88)'])
    : (isDark
        ? ['rgba(36, 20, 24, 0.92)', 'rgba(28, 16, 20, 0.88)', 'rgba(20, 12, 15, 0.85)']
        : ['rgba(255, 255, 255, 0.95)', 'rgba(254, 242, 242, 0.92)', 'rgba(254, 226, 226, 0.88)']);

  return (
    <Animated.View
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          height: cardHeight,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.85)',
        },
        animatedCardStyle,
      ]}>
      <Pressable style={styles.cardInner} onPress={onPressCard}>
        {/* Fondo de Vidrio Translúcido con Resplandor Orgánico */}
        <LinearGradient
          colors={glassGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {isActive && (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(140)}
            style={styles.cardContent}>
            {/* Fila Superior: Insignia de Estado y Ubicación en la Agenda */}
            <View style={styles.cardTopRow}>
              <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                <View style={[styles.statusBeaconDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {item.isAvailable ? 'DISPONIBLE' : 'EN REUNIÓN'}
                </Text>
              </View>

              {item.isCurrentNow ? (
                <View
                  style={[
                    styles.currentNowBadge,
                    isDark ? styles.currentNowBadgeDark : styles.currentNowBadgeLight,
                  ]}>
                  <View style={[styles.pulseDot, { backgroundColor: isDark ? '#0A84FF' : '#007AFF' }]} />
                  <Text style={[styles.currentNowBadgeText, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
                    BLOQUE ACTUAL
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.slotOrderBadge,
                    isDark ? styles.slotOrderBadgeDark : styles.slotOrderBadgeLight,
                  ]}>
                  <Text style={[styles.slotOrderText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {index + 1} de {totalLength}
                  </Text>
                </View>
              )}
            </View>

            {/* Bloque Central de Horario en Formato Tabular Apple */}
            <View style={styles.cardTimeSection}>
              <Text
                style={[
                  styles.timeMainText,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                {item.desde}
              </Text>
              <View style={styles.timeArrowRow}>
                <View
                  style={[
                    styles.timeArrowLine,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.10)' },
                  ]}
                />
                <View
                  style={[
                    styles.durationPill,
                    isDark ? styles.durationPillDark : styles.durationPillLight,
                  ]}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.durationText,
                      isDark ? styles.textMutedDark : styles.textMutedLight,
                    ]}>
                    {item.duration}
                  </Text>
                </View>
                <View
                  style={[
                    styles.timeArrowLine,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.10)' },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.timeMainText,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                {item.hasta}
              </Text>
            </View>

            {/* Asunto y Título de la Franja (Sin tarjeta anidada artificial) */}
            <View style={styles.cardSubjectSection}>
              <Text
                style={[
                  styles.cardSubjectLabel,
                  isDark ? styles.textMutedDark : styles.textMutedLight,
                ]}>
                {item.isAvailable ? 'ESTADO' : 'REUNIÓN'}
              </Text>
              <Text
                style={[
                  styles.cardSubjectTitle,
                  isDark ? styles.textDark : styles.textLight,
                ]}
                numberOfLines={2}>
                {item.titulo}
              </Text>
            </View>

            {/* Detalles de Organizador o Disponibilidad Inmediata */}
            <View
              style={[
                styles.detailsSurface,
                isDark ? styles.detailsSurfaceDark : styles.detailsSurfaceLight,
              ]}>
              {item.organizador && !item.isAvailable ? (
                <View style={styles.organizerRow}>
                  <View
                    style={[
                      styles.organizerAvatar,
                      isDark ? styles.organizerAvatarDark : styles.organizerAvatarLight,
                    ]}>
                    <Ionicons
                      name="person"
                      size={15}
                      color={isDark ? '#0A84FF' : '#007AFF'}
                    />
                  </View>
                  <View style={styles.organizerTextCol}>
                    <Text
                      style={[
                        styles.organizerName,
                        isDark ? styles.textDark : styles.textLight,
                      ]}
                      numberOfLines={1}>
                      {item.organizador}
                    </Text>
                    {item.correo_organizador ? (
                      <Text
                        style={[
                          styles.organizerEmail,
                          isDark ? styles.textMutedDark : styles.textMutedLight,
                        ]}
                        numberOfLines={1}>
                        {item.correo_organizador}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={styles.availableRow}>
                  <View
                    style={[
                      styles.availableBeaconWrap,
                      isDark ? styles.availableBeaconWrapDark : styles.availableBeaconWrapLight,
                    ]}>
                    <Ionicons
                      name="sparkles"
                      size={16}
                      color={isDark ? '#34C759' : '#15803D'}
                    />
                  </View>
                  <View style={styles.availableTextCol}>
                    <Text
                      style={[
                        styles.availableTitle,
                        { color: isDark ? '#34C759' : '#15803D' },
                      ]}>
                      Espacio Libre
                    </Text>
                    <Text
                      style={[
                        styles.availableSubtitle,
                        isDark ? styles.textMutedDark : styles.textMutedLight,
                      ]}>
                      Disponible para ingreso inmediato
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Pie de Página de la Tarjeta */}
            <View
              style={[
                styles.cardFooterRow,
                { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)' },
              ]}>
              <View style={styles.footerItem}>
                <Ionicons
                  name="business-outline"
                  size={13}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.footerText,
                    isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}>
                  {item.salaNombre || 'Sala de Conferencias'}
                </Text>
              </View>
              <Text
                style={[
                  styles.footerDot,
                  { color: isDark ? '#475569' : '#CBD5E1' },
                ]}>
                •
              </Text>
              <View style={styles.footerItem}>
                <Ionicons
                  name="globe-outline"
                  size={13}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.footerText,
                    isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}>
                  {item.zona_horaria || 'America/Caracas'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export interface FeatureCarouselProps {
  items?: AgendaCardItem[];
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  panelTitle?: string;
  isDark?: boolean;
}

export function FeatureCarousel({
  items = DEFAULT_AGENDA_ITEMS,
  selectedIndex = 0,
  onSelectIndex,
  panelTitle,
  isDark: isDarkProp,
}: FeatureCarouselProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : colorScheme === 'dark';
  const isTablet = width >= 768;

  const totalLength = items.length;
  const activeIndex =
    totalLength === 0 ? 0 : Math.min(Math.max(0, selectedIndex), totalLength - 1);

  const handleChipClick = (index: number) => {
    if (onSelectIndex) {
      onSelectIndex(index);
    }
  };

  const handleNextCard = () => {
    if (totalLength <= 1) return;
    const nextIdx = (activeIndex + 1) % totalLength;
    if (onSelectIndex) {
      onSelectIndex(nextIdx);
    }
  };

  const cardWidth = isTablet
    ? Math.min(440, width * 0.44)
    : Math.min(340, width - 40);
  const cardHeight = cardWidth * 1.28;

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.mainCard,
          isDark ? styles.mainCardDark : styles.mainCardLight,
          isTablet ? styles.mainCardRow : styles.mainCardColumn,
        ]}>
        {/* Panel Izquierdo: Lista de Franjas en Vidrio Pulido */}
        <View
          style={[
            styles.leftPanel,
            isDark ? styles.leftPanelDark : styles.leftPanelLight,
            isTablet ? styles.leftPanelRow : styles.leftPanelColumn,
          ]}>
          {panelTitle ? (
            <View
              style={[
                styles.panelTitleContainer,
                isDark ? styles.panelTitleDark : styles.panelTitleLight,
              ]}>
              <Ionicons
                name="layers-outline"
                size={13}
                color={isDark ? '#0A84FF' : '#007AFF'}
              />
              <Text
                style={[
                  styles.panelTitleText,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                {panelTitle.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Difuminados de degradado de vidrio superior e inferior */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(13, 17, 26, 0.95)', 'rgba(13, 17, 26, 0.4)', 'transparent']
                : ['rgba(241, 245, 249, 0.95)', 'rgba(241, 245, 249, 0.4)', 'transparent']
            }
            style={styles.gradientTop}
            pointerEvents="none"
          />

          <View style={styles.chipsContainer}>
            {items.map((item, index) => (
              <ChipItem
                key={item.id}
                item={item}
                index={index}
                selectedIndex={activeIndex}
                totalLength={totalLength}
                onPress={handleChipClick}
                isDark={isDark}
              />
            ))}
          </View>

          <LinearGradient
            colors={
              isDark
                ? ['transparent', 'rgba(13, 17, 26, 0.4)', 'rgba(13, 17, 26, 0.95)']
                : ['transparent', 'rgba(241, 245, 249, 0.4)', 'rgba(241, 245, 249, 0.95)']
            }
            style={styles.gradientBottom}
            pointerEvents="none"
          />
        </View>

        {/* Panel Derecho: Escenario 3D de Vidrio Escarchado */}
        <View
          style={[
            styles.rightPanel,
            isDark ? styles.rightPanelDark : styles.rightPanelLight,
            isTablet ? styles.rightPanelRow : styles.rightPanelColumn,
          ]}>
          <View style={[styles.cardStage, { width: cardWidth, height: cardHeight }]}>
            {items.map((item, index) => (
              <CardItem
                key={item.id}
                item={item}
                index={index}
                selectedIndex={activeIndex}
                totalLength={totalLength}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                onPressCard={handleNextCard}
                isDark={isDark}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    width: '100%',
    maxWidth: 1140,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  mainCardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  mainCardDark: {
    backgroundColor: 'rgba(15, 20, 31, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainCardRow: {
    flexDirection: 'row',
    minHeight: 560,
  },
  mainCardColumn: {
    flexDirection: 'column',
  },
  leftPanel: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftPanelLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.65)',
    borderRightColor: 'rgba(226, 232, 240, 0.7)',
  },
  leftPanelDark: {
    backgroundColor: 'rgba(13, 17, 26, 0.65)',
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  leftPanelRow: {
    width: '42%',
    minHeight: 560,
    paddingHorizontal: 20,
    borderRightWidth: 1,
  },
  leftPanelColumn: {
    width: '100%',
    height: 320,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  panelTitleContainer: {
    position: 'absolute',
    top: 18,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  panelTitleLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
  panelTitleDark: {
    backgroundColor: 'rgba(24, 32, 48, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  panelTitleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chipsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chipWrapper: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipButton: {
    width: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
  },
  chipButtonLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  chipButtonDark: {
    backgroundColor: 'rgba(22, 28, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipButtonActiveLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0, 122, 255, 0.5)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  chipButtonActiveDark: {
    backgroundColor: 'rgba(28, 38, 58, 0.95)',
    borderColor: 'rgba(10, 132, 255, 0.6)',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  chipLeftIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTextCol: {
    flex: 1,
  },
  chipTimeText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chipTimeActive: {
    fontWeight: '800',
  },
  chipSubText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  nowBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nowBadgeMiniLight: {
    backgroundColor: '#007AFF',
  },
  nowBadgeMiniDark: {
    backgroundColor: '#0A84FF',
  },
  nowBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 10,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 10,
  },
  rightPanel: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rightPanelLight: {
    backgroundColor: 'rgba(241, 245, 249, 0.4)',
  },
  rightPanelDark: {
    backgroundColor: 'rgba(10, 14, 22, 0.4)',
  },
  rightPanelRow: {
    flex: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  rightPanelColumn: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  cardStage: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBeaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  currentNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  currentNowBadgeLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.10)',
    borderColor: 'rgba(0, 122, 255, 0.28)',
  },
  currentNowBadgeDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    borderColor: 'rgba(10, 132, 255, 0.35)',
  },
  currentNowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  slotOrderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotOrderBadgeLight: {
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
  },
  slotOrderBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  slotOrderText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTimeSection: {
    alignItems: 'center',
    marginVertical: 6,
  },
  timeMainText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  timeArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '84%',
    marginVertical: 6,
    gap: 8,
  },
  timeArrowLine: {
    flex: 1,
    height: 1,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationPillLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
  durationPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubjectSection: {
    paddingHorizontal: 4,
  },
  cardSubjectLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  cardSubjectTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  detailsSurface: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  detailsSurfaceLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  detailsSurfaceDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  organizerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  organizerAvatarLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
  organizerAvatarDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
    borderColor: 'rgba(10, 132, 255, 0.32)',
  },
  organizerTextCol: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  organizerEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availableBeaconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  availableBeaconWrapLight: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  availableBeaconWrapDark: {
    backgroundColor: 'rgba(52, 199, 89, 0.20)',
    borderColor: 'rgba(52, 199, 89, 0.35)',
  },
  availableTextCol: {
    flex: 1,
  },
  availableTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  availableSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 11,
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  textMutedLight: {
    color: '#64748B',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});

export default FeatureCarousel;
