import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AgendaCardItem, FeatureCarousel } from "@/components/feature-carousel";
import { KhLogo } from "@/components/kh-logo";
import { DEFAULT_AGENDA_DATA, DEFAULT_SALAS } from "@/constants/mock-agenda";
import { AgendaResponse, SalaInfo } from "@/types/agenda";
import {
  ConfiguredRoom,
  getConfiguredRoom,
  getThemePreference,
  saveConfiguredRoom,
  saveThemePreference,
  ThemePreference,
} from "@/utils/storage";
import {
  calculateDuration,
  findCurrentEventIndex,
  formatCurrentTime,
  normalizeAgendaEventos,
} from "@/utils/time";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const isDark =
    themePref === "system" ? colorScheme === "dark" : themePref === "dark";

  // Estado de salas y sala asignada a esta tablet
  const [salas, setSalas] = useState<SalaInfo[]>(
    DEFAULT_SALAS.map((s) => ({
      nombre: s.nombre,
      email: s.email,
      timezone: "America/Caracas",
    })),
  );
  const [currentRoom, setCurrentRoom] = useState<ConfiguredRoom>(
    DEFAULT_SALAS[0],
  );
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedRoomInModal, setSelectedRoomInModal] =
    useState<ConfiguredRoom>(DEFAULT_SALAS[0]);
  const [selectedThemeInModal, setSelectedThemeInModal] =
    useState<ThemePreference>("system");

  // Estado de la agenda y carga
  const [agenda, setAgenda] = useState<AgendaResponse>(DEFAULT_AGENDA_DATA);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reloj del sistema y selección del carrusel
  const [systemTime, setSystemTime] = useState<{
    timeString: string;
    dateString: string;
  }>(formatCurrentTime());
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false);

  // Cargar lista de salas disponibles desde el backend real
  const cargarSalas = useCallback(async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/salas", {
        timeout: 3500,
        headers: { "X-API-Key": process.env.EXPO_PUBLIC_API_KEY ?? "" },
      });
      if (response.data?.salas?.length) {
        setSalas(response.data.salas);
      }
    } catch {
      setSalas(
        DEFAULT_SALAS.map((s) => ({
          nombre: s.nombre,
          email: s.email,
          timezone: "America/Caracas",
        })),
      );
    }
  }, []);

  // Consultar la agenda de la sala asignada a esta tablet
  const consultarAgenda = useCallback(async (emailToFetch: string) => {
    if (!emailToFetch) return;
    setLoading(true);

    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const response = await axios.get("http://127.0.0.1:8000/salas/agenda", {
        headers: { "X-API-Key": process.env.EXPO_PUBLIC_API_KEY ?? "" },
        params: {
          email: emailToFetch,
          fecha: todayStr,
        },
        timeout: 4500,
      });

      if (response.data && response.data.sala) {
        const agendaData = response.data;
        // Si el API devuelve nombre null/vacío, buscar en el catálogo de salas
        if (!agendaData.sala.nombre) {
          const salaEnCatalogo = salas.find((s) => s.email === emailToFetch);
          if (salaEnCatalogo?.nombre) {
            agendaData.sala.nombre = salaEnCatalogo.nombre;
          }
        }
        setAgenda(agendaData);
        // Sincronizar currentRoom con el nombre real (por si cambió)
        setCurrentRoom((prev) => ({
          ...prev,
          nombre: agendaData.sala.nombre || prev.nombre,
        }));
      } else {
        throw new Error("Respuesta inválida");
      }
    } catch {
      setAgenda(DEFAULT_AGENDA_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Inicialización: cargar sala persistida de la tablet y consultar backend
  useEffect(() => {
    async function initTablet() {
      await cargarSalas();
      const savedTheme = await getThemePreference();
      setThemePref(savedTheme);
      setSelectedThemeInModal(savedTheme);

      const savedRoom = await getConfiguredRoom();
      if (savedRoom) {
        setCurrentRoom(savedRoom);
        setSelectedRoomInModal(savedRoom);
        await consultarAgenda(savedRoom.email);
      } else {
        await consultarAgenda(DEFAULT_SALAS[0].email);
      }
    }
    void initTablet();
  }, [cargarSalas, consultarAgenda]);

  // Normalizar eventos (corrige el problema de bloques "hasta: 05:00 PM" cuando hay reuniones antes)
  const normalizedEventos = useMemo(
    () => normalizeAgendaEventos(agenda?.eventos || []),
    [agenda?.eventos],
  );

  // Reloj del sistema y cálculo de la franja horaria actual
  useEffect(() => {
    const updateTimeAndSlot = () => {
      const now = new Date();
      setSystemTime(formatCurrentTime(now));

      if (normalizedEventos.length > 0) {
        const activeIdx = findCurrentEventIndex(normalizedEventos, now);
        setCurrentSlotIndex(activeIdx);
        setCarouselIndex(activeIdx);
      }
    };

    updateTimeAndSlot();
    const interval = setInterval(updateTimeAndSlot, 15000);
    return () => clearInterval(interval);
  }, [normalizedEventos]);

  // Volver a la pantalla principal por inactividad
  useEffect(() => {
    let active = false;
    if (
      showDetailedSchedule ||
      isConfigModalOpen ||
      carouselIndex !== currentSlotIndex
    ) {
      active = true;
    }

    if (active) {
      const timeout = setTimeout(() => {
        setShowDetailedSchedule(false);
        setIsConfigModalOpen(false);
        setCarouselIndex(currentSlotIndex);
      }, 45000); // 45 segundos de inactividad
      return () => clearTimeout(timeout);
    }
  }, [
    showDetailedSchedule,
    isConfigModalOpen,
    carouselIndex,
    currentSlotIndex,
  ]);

  // Guardar configuración de la sala en AsyncStorage para esta tablet
  const handleSaveRoomConfig = async () => {
    await saveConfiguredRoom(selectedRoomInModal);
    setCurrentRoom(selectedRoomInModal);
    await saveThemePreference(selectedThemeInModal);
    setThemePref(selectedThemeInModal);
    setIsConfigModalOpen(false);
    await consultarAgenda(selectedRoomInModal.email);
  };

  const onRefresh = () => {
    setRefreshing(true);
    void consultarAgenda(currentRoom.email);
  };

  // Mapear los eventos normalizados a los ítems del carrusel Apple Glass
  const agendaItems: AgendaCardItem[] = normalizedEventos.map(
    (evento, index) => {
      const isAvailable =
        !evento.id ||
        evento.titulo.trim().toLowerCase() === "disponible" ||
        evento.organizador === null;

      const duration = calculateDuration(evento.desde, evento.hasta);
      const isCurrentNow = index === currentSlotIndex;

      return {
        id: evento.id || `slot-${index}-${evento.desde}`,
        desde: evento.desde,
        hasta: evento.hasta,
        duration,
        titulo: evento.titulo.trim(),
        organizador: evento.organizador,
        correo_organizador: evento.correo_organizador,
        isAvailable,
        isCurrentNow,
        fecha: evento.fecha || agenda.fecha,
        zona_horaria: evento.zona_horaria || agenda.sala.timezone,
        salaNombre: currentRoom.nombre || agenda.sala.nombre,
      };
    },
  );

  const activeSlot = agendaItems[currentSlotIndex];
  const isRoomCurrentlyAvailable = activeSlot ? activeSlot.isAvailable : true;
  // Fuente de verdad: currentRoom.nombre (sincronizado al cargar agenda)
  // Fallback encadenado: agenda.sala.nombre -> currentRoom.nombre -> ""
  const roomDisplayName = currentRoom.nombre || agenda?.sala?.nombre || "";

  // Colores dinámicos del estado para la cabecera
  const statusColor = isRoomCurrentlyAvailable
    ? isDark
      ? "#34C759"
      : "#15803D"
    : isDark
      ? "#FF453A"
      : "#DC2626";

  const statusBg = isRoomCurrentlyAvailable
    ? isDark
      ? "rgba(52, 199, 89, 0.18)"
      : "rgba(52, 199, 89, 0.12)"
    : isDark
      ? "rgba(255, 69, 58, 0.18)"
      : "rgba(239, 68, 68, 0.10)";

  const statusBorder = isRoomCurrentlyAvailable
    ? isDark
      ? "rgba(52, 199, 89, 0.40)"
      : "rgba(52, 199, 89, 0.32)"
    : isDark
      ? "rgba(255, 69, 58, 0.40)"
      : "rgba(239, 68, 68, 0.30)";

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark ? styles.bgDark : styles.bgLight]}
    >
      {/* Fondo ambiental sutil con gradiente escarchado */}
      <LinearGradient
        colors={
          isDark
            ? ["#0A0D15", "#0E131E", "#090B11"]
            : ["#F1F5F9", "#E8EEF5", "#F8FAFC"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#0A84FF" : "#007AFF"}
          />
        }
      >
        {/* Cabecera Apple Glassmorphic: Sala, Estado en Vivo, Reloj y Controles */}
        <View
          style={[
            styles.headerContainer,
            isDark ? styles.headerGlassDark : styles.headerGlassLight,
            isTablet && styles.headerTablet,
          ]}
        >
          {/* Lado Izquierdo: Identidad de la Sala y Baliza de Estado */}
          <View style={styles.headerLeftCol}>
            <View style={styles.roomHeaderRow}>
              <Text
                style={[
                  styles.roomHeaderTitle,
                  isDark ? styles.textDark : styles.textLight,
                ]}
                numberOfLines={1}
              >
                {roomDisplayName}
              </Text>

              {/* Insignia de Estado con Baliza Luminosa */}
              <View
                style={[
                  styles.compactStatusPill,
                  { backgroundColor: statusBg, borderColor: statusBorder },
                ]}
              >
                <View
                  style={[
                    styles.statusBeaconDot,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text
                  style={[styles.compactStatusText, { color: statusColor }]}
                >
                  {isRoomCurrentlyAvailable ? "DISPONIBLE" : "EN REUNIÓN"}
                </Text>
              </View>
            </View>

            {/* Subtítulo con Horario y Zona */}
            <View style={styles.roomSubInfoRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
              <Text
                style={[
                  styles.roomSubInfoText,
                  isDark ? styles.textMutedDark : styles.textMutedLight,
                ]}
              >
                {activeSlot
                  ? isRoomCurrentlyAvailable
                    ? `Libre hasta las ${activeSlot.hasta}`
                    : `Ocupada con ${activeSlot.titulo} hasta las ${activeSlot.hasta}`
                  : "Sin eventos registrados hoy"}
              </Text>
              <Text
                style={[
                  styles.dotSeparator,
                  { color: isDark ? "#475569" : "#CBD5E1" },
                ]}
              >
                •
              </Text>
              <Text
                style={[
                  styles.roomSubTimezoneText,
                  isDark ? styles.textMutedDark : styles.textMutedLight,
                ]}
              >
                {agenda?.sala?.timezone || "America/Caracas"}
              </Text>
            </View>
          </View>

          {/* Lado Derecho: Reloj Tabular y Botones de Cristal */}
          <View style={styles.headerRightCol}>
            <View style={styles.clockBlock}>
              <Text
                style={[
                  styles.clockTimeText,
                  isDark ? styles.textDark : styles.textLight,
                ]}
              >
                {systemTime.timeString}
              </Text>
              <Text
                style={[
                  styles.clockDateText,
                  isDark ? styles.textMutedDark : styles.textMutedLight,
                ]}
              >
                {systemTime.dateString}
              </Text>
            </View>

            <View style={styles.actionButtonsRow}>
              {/* Botón de Sincronización */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  isDark ? styles.iconActionBtnDark : styles.iconActionBtnLight,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void consultarAgenda(currentRoom.email)}
                accessibilityLabel="Actualizar agenda"
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                ) : (
                  <Ionicons
                    name="sync"
                    size={17}
                    color={isDark ? "#94A3B8" : "#64748B"}
                  />
                )}
              </Pressable>

              {/* Botón de Ajustes de la Tablet */}
              <Pressable
                style={({ pressed }) => [
                  styles.iconActionBtn,
                  isDark ? styles.iconActionBtnDark : styles.iconActionBtnLight,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => {
                  setSelectedRoomInModal(currentRoom);
                  setIsConfigModalOpen(true);
                }}
                accessibilityLabel="Configurar Sala"
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Carrusel Apple Glassmorphic de Horarios */}
        {!showDetailedSchedule && (
          <View style={styles.carouselSectionWrapper}>
            <View style={styles.carouselBarRow}>
              <View style={styles.carouselTitleRow}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={isDark ? "#0A84FF" : "#007AFF"}
                />
                <Text
                  style={[
                    styles.carouselSectionTitle,
                    isDark ? styles.textDark : styles.textLight,
                  ]}
                >
                  HORARIOS DEL DÍA
                </Text>
                <View
                  style={[
                    styles.slotsCountBadge,
                    isDark
                      ? styles.slotsCountBadgeDark
                      : styles.slotsCountBadgeLight,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotsCountText,
                      isDark ? styles.textMutedDark : styles.textMutedLight,
                    ]}
                  >
                    {agendaItems.length} bloques
                  </Text>
                </View>
              </View>

              {carouselIndex !== currentSlotIndex && (
                <Pressable
                  style={({ pressed }) => [
                    styles.jumpToNowBtn,
                    isDark ? styles.jumpToNowBtnDark : styles.jumpToNowBtnLight,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => setCarouselIndex(currentSlotIndex)}
                >
                  <Ionicons
                    name="locate"
                    size={14}
                    color={isDark ? "#0A84FF" : "#007AFF"}
                  />
                  <Text
                    style={[
                      styles.jumpToNowBtnText,
                      { color: isDark ? "#0A84FF" : "#007AFF" },
                    ]}
                  >
                    Ir al bloque actual
                  </Text>
                </Pressable>
              )}
            </View>

            <FeatureCarousel
              items={agendaItems}
              selectedIndex={carouselIndex}
              onSelectIndex={(idx) => setCarouselIndex(idx)}
              panelTitle={roomDisplayName}
              isDark={isDark}
            />
          </View>
        )}

        {/* Sección Inferior: Cronograma Completo en Hoja de Vidrio Pulido */}
        <View style={styles.timelineSectionWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.timelineHeaderRow,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowDetailedSchedule(!showDetailedSchedule)}
          >
            <Ionicons
              name="list"
              size={16}
              color={isDark ? "#0A84FF" : "#007AFF"}
            />
            <Text
              style={[
                styles.timelineSectionTitle,
                isDark ? styles.textDark : styles.textLight,
              ]}
            >
              CRONOGRAMA DETALLADO
            </Text>
            <Ionicons
              name={showDetailedSchedule ? "chevron-up" : "chevron-down"}
              size={18}
              color={isDark ? "#64748B" : "#94A3B8"}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>

          {/* Contenedor Unificado en Vidrio Escarchado */}
          {showDetailedSchedule && (
            <View
              style={[
                styles.timelineContainer,
                isDark
                  ? styles.timelineContainerDark
                  : styles.timelineContainerLight,
              ]}
            >
              {agendaItems.map((item, index) => {
                const isSelected = index === carouselIndex;
                const isCurrent = item.isCurrentNow;

                const itemStatusColor = item.isAvailable
                  ? isDark
                    ? "#34C759"
                    : "#15803D"
                  : isDark
                    ? "#FF453A"
                    : "#DC2626";

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setCarouselIndex(index)}
                    style={({ pressed }) => [
                      styles.timelineRow,
                      isDark ? styles.timelineRowDark : styles.timelineRowLight,
                      isSelected &&
                        (isDark
                          ? styles.timelineRowSelectedDark
                          : styles.timelineRowSelectedLight),
                      pressed && styles.btnPressed,
                    ]}
                  >
                    {/* Barra lateral indicadora de estado */}
                    <View
                      style={[
                        styles.timelineAccentBar,
                        {
                          backgroundColor: isCurrent
                            ? isDark
                              ? "#0A84FF"
                              : "#007AFF"
                            : itemStatusColor,
                        },
                      ]}
                    />

                    {/* Columna Horaria con Tabular Nums */}
                    <View style={styles.timelineTimeCol}>
                      <Text
                        style={[
                          styles.timelineTimeStart,
                          isDark ? styles.textDark : styles.textLight,
                        ]}
                      >
                        {item.desde}
                      </Text>
                      <Ionicons
                        name="arrow-down"
                        size={10}
                        color={isDark ? "#64748B" : "#94A3B8"}
                        style={{ marginVertical: 2 }}
                      />
                      <Text
                        style={[
                          styles.timelineTimeEnd,
                          isDark ? styles.textMutedDark : styles.textMutedLight,
                        ]}
                      >
                        {item.hasta}
                      </Text>
                      <View
                        style={[
                          styles.timelineDurationBadge,
                          item.isAvailable
                            ? isDark
                              ? styles.durationBadgeFreeDark
                              : styles.durationBadgeFreeLight
                            : isDark
                              ? styles.durationBadgeBusyDark
                              : styles.durationBadgeBusyLight,
                        ]}
                      >
                        <Text
                          style={[
                            styles.timelineDurationText,
                            { color: itemStatusColor },
                          ]}
                        >
                          {item.duration}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.timelineDivider,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(15, 23, 42, 0.08)",
                        },
                      ]}
                    />

                    {/* Columna de Información */}
                    <View style={styles.timelineInfoCol}>
                      <View style={styles.timelineCardHeader}>
                        <Text
                          style={[
                            styles.timelineCardTitle,
                            isDark ? styles.textDark : styles.textLight,
                          ]}
                          numberOfLines={1}
                        >
                          {item.titulo}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {isCurrent && (
                            <View
                              style={[
                                styles.timelineNowBadge,
                                isDark
                                  ? styles.timelineNowBadgeDark
                                  : styles.timelineNowBadgeLight,
                              ]}
                            >
                              <View style={styles.pulseDot} />
                              <Text style={styles.timelineNowText}>AHORA</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.timelineStatusBadge,
                              item.isAvailable
                                ? isDark
                                  ? styles.badgeFreeDark
                                  : styles.badgeFreeLight
                                : isDark
                                  ? styles.badgeBusyDark
                                  : styles.badgeBusyLight,
                            ]}
                          >
                            <Text
                              style={[
                                styles.timelineStatusBadgeText,
                                { color: itemStatusColor },
                              ]}
                            >
                              {item.isAvailable ? "DISPONIBLE" : "RESERVADO"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {item.organizador && !item.isAvailable ? (
                        <View style={styles.timelineOrganizerRow}>
                          <Ionicons
                            name="person"
                            size={13}
                            color={isDark ? "#0A84FF" : "#007AFF"}
                          />
                          <Text
                            style={[
                              styles.timelineOrganizerText,
                              isDark
                                ? styles.textMutedDark
                                : styles.textMutedLight,
                            ]}
                            numberOfLines={1}
                          >
                            {item.organizador}
                            {item.correo_organizador
                              ? ` • ${item.correo_organizador}`
                              : ""}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.timelineAvailableNotice,
                            { color: isDark ? "#34C759" : "#15803D" },
                          ]}
                        >
                          {item.organizador ||
                            "Espacio libre para uso inmediato."}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Apple Glassmorphism para Selección de Sala */}
      <Modal
        visible={isConfigModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsConfigModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              isDark ? styles.modalCardDark : styles.modalCardLight,
              isTablet && styles.modalCardTablet,
            ]}
          >
            {/* Cabecera del Modal */}
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              ]}
            >
              <View
                style={[
                  styles.modalIconWrap,
                  isDark ? styles.modalIconWrapDark : styles.modalIconWrapLight,
                ]}
              >
                <Ionicons
                  name="tablet-landscape"
                  size={20}
                  color={isDark ? "#0A84FF" : "#007AFF"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.modalTitle,
                    isDark ? styles.textDark : styles.textLight,
                  ]}
                >
                  Asignar Sala a esta Tablet
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}
                >
                  {salas.length} salas disponibles en el sistema
                </Text>
              </View>
              <Pressable
                onPress={() => setIsConfigModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={isDark ? "#64748B" : "#94A3B8"}
                />
              </Pressable>
            </View>

            {/* Lista de Salas */}
            <ScrollView
              style={styles.modalRoomsList}
              showsVerticalScrollIndicator={true}
            >
              {salas.map((room) => {
                const isSelected = selectedRoomInModal.email === room.email;
                return (
                  <Pressable
                    key={room.email}
                    onPress={() =>
                      setSelectedRoomInModal({
                        nombre: room.nombre,
                        email: room.email,
                      })
                    }
                    style={({ pressed }) => [
                      styles.modalRoomOption,
                      isDark
                        ? styles.modalRoomOptionDark
                        : styles.modalRoomOptionLight,
                      isSelected &&
                        (isDark
                          ? styles.modalRoomOptionSelectedDark
                          : styles.modalRoomOptionSelectedLight),
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.modalRoomIconCircle,
                        isDark
                          ? styles.modalRoomIconCircleDark
                          : styles.modalRoomIconCircleLight,
                      ]}
                    >
                      <Ionicons
                        name="business"
                        size={16}
                        color={
                          isSelected
                            ? isDark
                              ? "#0A84FF"
                              : "#007AFF"
                            : isDark
                              ? "#94A3B8"
                              : "#64748B"
                        }
                      />
                    </View>

                    <View style={styles.modalRoomTextCol}>
                      <Text
                        style={[
                          styles.modalRoomName,
                          isDark ? styles.textDark : styles.textLight,
                          isSelected && {
                            color: isDark ? "#0A84FF" : "#007AFF",
                          },
                        ]}
                      >
                        {room.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.modalRoomEmail,
                          isDark ? styles.textMutedDark : styles.textMutedLight,
                        ]}
                      >
                        {room.email}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioButton,
                        isDark
                          ? styles.radioButtonDark
                          : styles.radioButtonLight,
                        isSelected &&
                          (isDark
                            ? styles.radioButtonSelectedDark
                            : styles.radioButtonSelectedLight),
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioButtonDot,
                            { backgroundColor: isDark ? "#0A84FF" : "#007AFF" },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Configuración de Tema */}
            <View style={styles.themeSelectorContainer}>
              <Text
                style={[
                  styles.themeSelectorTitle,
                  isDark ? styles.textDark : styles.textLight,
                ]}
              >
                Apariencia
              </Text>
              <View style={styles.themeOptionsRow}>
                {(["system", "light", "dark"] as ThemePreference[]).map(
                  (theme) => {
                    const isSelected = selectedThemeInModal === theme;
                    const label =
                      theme === "system"
                        ? "Sistema"
                        : theme === "light"
                          ? "Claro"
                          : "Oscuro";
                    const icon =
                      theme === "system"
                        ? "contrast"
                        : theme === "light"
                          ? "sunny"
                          : "moon";

                    return (
                      <Pressable
                        key={theme}
                        style={({ pressed }) => [
                          styles.themeOptionBtn,
                          isDark
                            ? styles.themeOptionBtnDark
                            : styles.themeOptionBtnLight,
                          isSelected &&
                            (isDark
                              ? styles.themeOptionSelectedDark
                              : styles.themeOptionSelectedLight),
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => setSelectedThemeInModal(theme)}
                      >
                        <Ionicons
                          name={icon}
                          size={16}
                          color={
                            isSelected
                              ? isDark
                                ? "#0A84FF"
                                : "#007AFF"
                              : isDark
                                ? "#94A3B8"
                                : "#64748B"
                          }
                        />
                        <Text
                          style={[
                            styles.themeOptionText,
                            isDark
                              ? styles.textMutedDark
                              : styles.textMutedLight,
                            isSelected && {
                              color: isDark ? "#0A84FF" : "#007AFF",
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </View>

            {/* Acciones del Modal */}
            <View
              style={[
                styles.modalActionsRow,
                {
                  borderTopColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(15, 23, 42, 0.08)",
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  isDark
                    ? styles.modalCancelBtnDark
                    : styles.modalCancelBtnLight,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => setIsConfigModalOpen(false)}
              >
                <Text
                  style={[
                    styles.modalCancelBtnText,
                    isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}
                >
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveBtn,
                  isDark ? styles.modalSaveBtnDark : styles.modalSaveBtnLight,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void handleSaveRoomConfig()}
              >
                <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                <Text style={styles.modalSaveBtnText}>
                  Guardar Configuración
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Brand Logo Flotante Discreto */}
      <View style={styles.brandLogoContainer}>
        <KhLogo width={32} height={32} isDark={isDark} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: "#F1F5F9",
  },
  bgDark: {
    backgroundColor: "#090D16",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    flexDirection: "column",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  headerGlassLight: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  headerGlassDark: {
    backgroundColor: "rgba(19, 25, 38, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTablet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  headerLeftCol: {
    flex: 1,
    gap: 6,
  },
  roomHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  roomHeaderTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  compactStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBeaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  compactStatusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  roomSubInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  roomSubInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dotSeparator: {
    fontSize: 12,
  },
  roomSubTimezoneText: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerRightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    justifyContent: "space-between",
  },
  clockBlock: {
    alignItems: "flex-end",
  },
  clockTimeText: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  clockDateText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
    textTransform: "capitalize",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  iconActionBtnLight: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  iconActionBtnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  carouselSectionWrapper: {
    marginTop: 6,
  },
  carouselBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 4,
  },
  carouselTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  carouselSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  slotsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotsCountBadgeLight: {
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  slotsCountBadgeDark: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  slotsCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
  jumpToNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  jumpToNowBtnLight: {
    backgroundColor: "rgba(0, 122, 255, 0.08)",
    borderColor: "rgba(0, 122, 255, 0.25)",
  },
  jumpToNowBtnDark: {
    backgroundColor: "rgba(10, 132, 255, 0.14)",
    borderColor: "rgba(10, 132, 255, 0.35)",
  },
  jumpToNowBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  timelineSectionWrapper: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  timelineSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  timelineContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  timelineContainerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  timelineContainerDark: {
    backgroundColor: "rgba(19, 25, 38, 0.85)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  timelineRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingRight: 16,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  timelineRowLight: {
    borderBottomColor: "rgba(226, 232, 240, 0.6)",
  },
  timelineRowDark: {
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  timelineRowSelectedLight: {
    backgroundColor: "rgba(0, 122, 255, 0.06)",
  },
  timelineRowSelectedDark: {
    backgroundColor: "rgba(10, 132, 255, 0.12)",
  },
  timelineAccentBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 4,
    marginLeft: 12,
    marginRight: 12,
    minHeight: 52,
  },
  timelineTimeCol: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
  },
  timelineTimeStart: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timelineTimeEnd: {
    fontSize: 11,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  timelineDurationBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  durationBadgeFreeLight: {
    backgroundColor: "rgba(52, 199, 89, 0.14)",
  },
  durationBadgeFreeDark: {
    backgroundColor: "rgba(52, 199, 89, 0.22)",
  },
  durationBadgeBusyLight: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
  },
  durationBadgeBusyDark: {
    backgroundColor: "rgba(255, 59, 48, 0.20)",
  },
  timelineDurationText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timelineDivider: {
    width: 1,
    height: "75%",
    marginHorizontal: 12,
  },
  timelineInfoCol: {
    flex: 1,
    gap: 4,
  },
  timelineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    letterSpacing: -0.2,
  },
  timelineNowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timelineNowBadgeLight: {
    backgroundColor: "#007AFF",
  },
  timelineNowBadgeDark: {
    backgroundColor: "#0A84FF",
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  timelineNowText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timelineStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeFreeLight: {
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderColor: "rgba(52, 199, 89, 0.35)",
  },
  badgeFreeDark: {
    backgroundColor: "rgba(52, 199, 89, 0.20)",
    borderColor: "rgba(52, 199, 89, 0.45)",
  },
  badgeBusyLight: {
    backgroundColor: "rgba(255, 59, 48, 0.10)",
    borderColor: "rgba(255, 59, 48, 0.30)",
  },
  badgeBusyDark: {
    backgroundColor: "rgba(255, 59, 48, 0.20)",
    borderColor: "rgba(255, 59, 48, 0.40)",
  },
  timelineStatusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timelineOrganizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timelineOrganizerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  timelineAvailableNotice: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 36,
    elevation: 16,
  },
  modalCardLight: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(255, 255, 255, 0.98)",
  },
  modalCardDark: {
    backgroundColor: "rgba(22, 28, 42, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalCardTablet: {
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalIconWrapLight: {
    backgroundColor: "rgba(0, 122, 255, 0.12)",
  },
  modalIconWrapDark: {
    backgroundColor: "rgba(10, 132, 255, 0.18)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalRoomsList: {
    maxHeight: 320,
    marginVertical: 4,
  },
  modalRoomOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  modalRoomOptionLight: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  modalRoomOptionDark: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  modalRoomOptionSelectedLight: {
    backgroundColor: "rgba(0, 122, 255, 0.10)",
    borderColor: "#007AFF",
  },
  modalRoomOptionSelectedDark: {
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderColor: "#0A84FF",
  },
  modalRoomIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  modalRoomIconCircleLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  modalRoomIconCircleDark: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalRoomTextCol: {
    flex: 1,
  },
  modalRoomName: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalRoomEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonLight: {
    borderColor: "#CBD5E1",
  },
  radioButtonDark: {
    borderColor: "#475569",
  },
  radioButtonSelectedLight: {
    borderColor: "#007AFF",
  },
  radioButtonSelectedDark: {
    borderColor: "#0A84FF",
  },
  radioButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modalCancelBtnLight: {
    backgroundColor: "rgba(241, 245, 249, 0.8)",
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  modalCancelBtnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalSaveBtn: {
    flex: 1.6,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSaveBtnLight: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
  },
  modalSaveBtnDark: {
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF",
  },
  modalSaveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  textLight: {
    color: "#0F172A",
  },
  textDark: {
    color: "#F8FAFC",
  },
  textMutedLight: {
    color: "#64748B",
  },
  textMutedDark: {
    color: "#94A3B8",
  },
  brandLogoContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    opacity: 0.35,
    pointerEvents: "none",
  },
  themeSelectorContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  themeSelectorTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  themeOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeOptionBtnLight: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  themeOptionBtnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  themeOptionSelectedLight: {
    backgroundColor: "rgba(0, 122, 255, 0.10)",
    borderColor: "#007AFF",
  },
  themeOptionSelectedDark: {
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderColor: "#0A84FF",
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
