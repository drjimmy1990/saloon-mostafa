INSERT INTO "public"."SystemSetting" ("key", "value") VALUES
  ('salon_address', ''),
  ('order_notification_whatsapp', ''),
  ('delivery_fee', '2'),
  ('salon_phone', '962786753791'),
  ('whatsapp_number', '962786753791'),
  ('working_hours_weekdays', 'السبت - الخميس: 10:00 ص - 8:00 م'),
  ('working_hours_friday', 'الجمعة: مغلق'),
  ('instagram_url', ''),
  ('facebook_url', ''),
  ('tiktok_url', ''),
  ('google_maps_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d217257.96330223998!2d35.72862505!3d31.9539494!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151b5fb85d7981b1%3A0x631c30c0f8dc65e8!2sAmman%2C%20Jordan!5e0!3m2!1sar!2sus!4v1'),
  ('booking_start_time', '09:00'),
  ('booking_end_time', '20:00')
ON CONFLICT ("key") DO NOTHING;