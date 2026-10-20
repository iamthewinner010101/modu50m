import metadata from './astraRoadviewImageSelections.metadata.json';
import d50PrimaryP4R from '../../outputs/dunsan-roadview-direction-audit/D50-002/D50-002-P4-R.jpg';
import d50SecondaryP1C from '../../outputs/dunsan-roadview-direction-audit/D50-002/D50-002-P1-C.jpg';

const l50Selection = metadata.selections['L50-002'];

const astraRoadviewImageSelections = Object.freeze({
  ...metadata.selections,
  'L50-002': Object.freeze({
    ...l50Selection,
    reviewer: metadata.reviewer,
    policy: metadata.policy,
    primary: Object.freeze({
      ...l50Selection.primary,
      image: d50PrimaryP4R,
    }),
    secondary: Object.freeze({
      ...l50Selection.secondary,
      image: d50SecondaryP1C,
    }),
  }),
  '15012890:01711': Object.freeze({
    ...metadata.selections['15012890:01711'],
    reviewer: metadata.reviewer,
    policy: metadata.policy,
  }),
});

export { metadata as astraRoadviewImageSelectionMetadata };
export default astraRoadviewImageSelections;
