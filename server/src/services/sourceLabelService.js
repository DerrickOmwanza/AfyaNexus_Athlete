const normalizeText = (value) => (value || '').toString().toLowerCase();

const textSuggestsHealthConnect = (value) => normalizeText(value).includes('health connect');

const withSourceLabel = (record, source_label) => ({
  ...record,
  source_label,
});

const detectManualOrImportedSource = (record, noteField) => {
  const note = normalizeText(record?.[noteField]);
  return textSuggestsHealthConnect(note) ? 'Android Health Connect' : 'Manual Entry';
};

const annotateRecoveryLog = (record) => withSourceLabel(record, detectManualOrImportedSource(record, 'notes'));
const annotateTrainingLog = (record) => withSourceLabel(record, detectManualOrImportedSource(record, 'notes'));
const annotateNutritionLog = (record) => withSourceLabel(record, detectManualOrImportedSource(record, 'meal_notes'));

const annotateWearableRecord = (record) => {
  const deviceId = normalizeText(record?.device_id);

  if (deviceId.includes('health-connect')) {
    return withSourceLabel(record, 'Android Health Connect');
  }

  if (record?.device_id) {
    return withSourceLabel(record, 'Wearable Sync');
  }

  return withSourceLabel(record, 'Unknown Source');
};

module.exports = {
  annotateNutritionLog,
  annotateRecoveryLog,
  annotateTrainingLog,
  annotateWearableRecord,
};
