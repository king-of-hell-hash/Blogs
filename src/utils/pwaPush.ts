/**
 * Client-Side PWA Utilities:
 * - Push Notification Subscription & Permission Request
 * - Background Sync Registration
 * - Periodic Background Sync Registration
 * - Completion Notifications
 */

export interface PushSubscriptionResult {
  success: boolean;
  permission: NotificationPermission;
  subscription?: PushSubscription | null;
  error?: string;
}

/**
 * Request Notification permission and register Push Subscription
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionResult> {
  if (!('Notification' in window)) {
    return { success: false, permission: 'denied', error: 'Notifications are not supported in this browser.' };
  }

  if (!('serviceWorker' in navigator)) {
    return { success: false, permission: 'denied', error: 'Service Workers are not supported in this browser.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: 'Notification permission was not granted.' };
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if PushManager is available
    if ('pushManager' in registration) {
      let subscription = await registration.pushManager.getSubscription();
      
      // If no subscription, create a self-managed local or standard subscription
      if (!subscription) {
        try {
          // Note: In production with custom backend VAPID, pass converted applicationServerKey
          // If no VAPID key is configured, userVisibleOnly subscription is registered
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        } catch (subErr) {
          console.log('[PWA] Push subscription without VAPID fallback available for local notifications:', subErr);
        }
      }

      return {
        success: true,
        permission: 'granted',
        subscription
      };
    }

    return {
      success: true,
      permission: 'granted',
      subscription: null
    };
  } catch (err: any) {
    console.warn('[PWA] Error subscribing to push:', err);
    return {
      success: false,
      permission: Notification.permission,
      error: err.message || 'Failed to subscribe to push notifications'
    };
  }
}

/**
 * Send a notification when blog post generation finishes (even if tab is unfocused)
 */
export async function notifyBlogGenerationComplete(title: string, wordCount?: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notificationTitle = 'SEO Blog Generated!';
  const notificationBody = `"${title.substring(0, 50)}..." is ready (${wordCount ? `${wordCount} words` : 'complete with SEO metadata and visuals'}).`;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: '/icons/icon-192x192.png',
        badge: '/favicon.png',
        data: { url: '/?tab=preview' },
        tag: 'blog-generated'
      });
      return;
    } catch {
      // Fallback to standard window Notification
    }
  }

  try {
    new Notification(notificationTitle, {
      body: notificationBody,
      icon: '/icons/icon-192x192.png'
    });
  } catch (e) {
    console.log('[PWA] Notification display skipped:', e);
  }
}

/**
 * Register Background Sync event tag if offline generation fails
 */
export async function registerBackgroundSync(tag: string = 'sync-blog-posts'): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration: any = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await registration.sync.register(tag);
      console.log(`[PWA] Background sync registered with tag: ${tag}`);
      return true;
    }
  } catch (err) {
    console.warn('[PWA] Background sync registration failed:', err);
  }
  return false;
}

/**
 * Register Periodic Background Sync (guarded so it doesn't break unsupported browsers)
 */
export async function registerPeriodicSync(tag: string = 'refresh-trending-topics'): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration: any = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      const status = await navigator.permissions?.query({
        name: 'periodic-background-sync' as any
      }).catch(() => null);

      if (status && status.state === 'granted') {
        await registration.periodicSync.register(tag, {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
        console.log(`[PWA] Periodic sync registered: ${tag}`);
        return true;
      }
    }
  } catch (err) {
    // Graceful fallback - periodic sync is progressive enhancement
    console.log('[PWA] Periodic sync skipped or unsupported:', err);
  }
  return false;
}
