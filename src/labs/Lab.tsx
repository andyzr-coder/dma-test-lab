import type { LabId } from '../types';
import { DifferenceLab, GateDerivativeLab, ReconvergenceLab } from './DifferenceLabs';
import { DLogicLab, DSearchLab, FaultTreeLab } from './FaultLabs';
import { ControllabilityLab, LearningLab } from './LearningLabs';
import SequentialLab from './SequentialLab';
import './labstyles.css';

export default function Lab({ id }: { id: LabId }) {
  switch(id) {
    case 'difference': return <DifferenceLab/>;
    case 'gate-derivative': return <GateDerivativeLab/>;
    case 'reconvergence': return <ReconvergenceLab/>;
    case 'fault-tree': return <FaultTreeLab/>;
    case 'd-logic': return <DLogicLab/>;
    case 'd-search': return <DSearchLab/>;
    case 'learning': return <LearningLab/>;
    case 'controllability': return <ControllabilityLab/>;
    case 'sequential': return <SequentialLab/>;
  }
}
