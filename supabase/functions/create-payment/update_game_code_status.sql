CREATE OR REPLACE FUNCTION update_game_code_status(
  p_game_code_id UUID,
  p_status TEXT,
  p_payment_status TEXT,
  p_payment_intent_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE game_codes
  SET 
    status = p_status,
    payment_status = p_payment_status,
    stripe_payment_intent_id = p_payment_intent_id
  WHERE 
    id = p_game_code_id
    AND status = 'available'
    AND payment_status = 'unpaid';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game code not found or already processed';
  END IF;
END;
$$;