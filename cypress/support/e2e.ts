import 'cypress-mochawesome-reporter/register';
import './commands';

import { register as registerGrep } from '@cypress/grep';

registerGrep();
